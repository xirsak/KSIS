#include <iostream>
#include <string>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <chrono>

#pragma comment(lib, "ws2_32.lib")

#define ICMP_ECHO_REQUEST 8
#define ICMP_ECHO_REPLY 0
#define ICMP_TIME_EXCEEDED 11

using namespace std;
const int MAX_HOPS = 30;
const int TRIES = 3;
const int TIMEOUT = 3000;

#pragma pack(push, 1)
struct IcmpHeader {
    unsigned char type;
    unsigned char code;
    unsigned short checksum;
    unsigned short id;
    unsigned short sequence;
};
#pragma pack(pop)

unsigned short CalculateChecksum(unsigned short* buffer, int size) {
    unsigned long sum = 0;
    while (size > 1) {
        sum += *buffer++;
        size -= sizeof(unsigned short);
    }
    if (size == 1)
        sum += *(unsigned char*)buffer;
    sum = (sum >> 16) + (sum & 0xFFFF);
    sum += (sum >> 16);
    return (unsigned short)(~sum);
}

string GetHostName(const char* ip) {
    struct sockaddr_in sa;
    sa.sin_family = AF_INET;
    inet_pton(AF_INET, ip, &sa.sin_addr);

    char host[NI_MAXHOST];
    if (getnameinfo((sockaddr*)&sa, sizeof(sa), host, NI_MAXHOST, nullptr, 0, 0) == 0)
        return string(host);

    return "";
}

int main() {
    setlocale(LC_ALL, "Russian");

    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        cerr << "Ошибка WSAStartup\n";
        return 1;
    }

    string target;
    cout << "Введите домен или IP-адрес: ";
    getline(cin, target);

    addrinfo hints = { 0 }, * res = nullptr;
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_RAW;
    hints.ai_protocol = IPPROTO_ICMP;
    if (getaddrinfo(target.c_str(), nullptr, &hints, &res) != 0 || res == nullptr) {
        cerr << "Не удалось разрешить адрес: " << target << endl;
        WSACleanup();
        return 1;
    }
    sockaddr_in destAddr = *(sockaddr_in*)res->ai_addr;
    char ipStr[INET_ADDRSTRLEN];
    inet_ntop(AF_INET, &destAddr.sin_addr, ipStr, sizeof(ipStr));
    freeaddrinfo(res);

    cout << "\nТрассировка маршрута к " << target << " [" << ipStr
        << "], максимальное число прыжков: " << MAX_HOPS << "\n\n";

    SOCKET sock = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);
    if (sock == INVALID_SOCKET) {
        cerr << "Ошибка создания сокета (требуются права администратора).\n";
        WSACleanup();
        return 1;
    }
    int timeout = TIMEOUT;
    setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, (char*)&timeout, sizeof(timeout));

    unsigned short processId = (unsigned short)GetCurrentProcessId();

    bool reached = false;
    for (int ttl = 1; ttl <= MAX_HOPS && !reached; ttl++) {
        if (setsockopt(sock, IPPROTO_IP, IP_TTL, (char*)&ttl, sizeof(ttl)) == SOCKET_ERROR) {
            cerr << "Ошибка setsockopt(IP_TTL): " << WSAGetLastError() << endl;
            break;
        }

        cout << ttl << "\t";
        bool gotAnyReply = false;
        char lastReplyIp[INET_ADDRSTRLEN] = { 0 };
        string lastHost = "";

        for (int i = 0; i < TRIES; i++) {
            IcmpHeader icmpReq = { 0 };
            icmpReq.type = ICMP_ECHO_REQUEST;
            icmpReq.code = 0;
            icmpReq.id = htons(processId);
            icmpReq.sequence = htons(ttl * 100 + i);
            icmpReq.checksum = 0;

            const int packetSize = sizeof(IcmpHeader) + 4;
            char packet[packetSize] = { 0 };
            memcpy(packet, &icmpReq, sizeof(IcmpHeader));
            icmpReq.checksum = CalculateChecksum((unsigned short*)packet, packetSize);
            memcpy(packet, &icmpReq, sizeof(IcmpHeader));

            auto startTime = chrono::high_resolution_clock::now();
            int sentBytes = sendto(sock, packet, packetSize, 0, (sockaddr*)&destAddr, sizeof(destAddr));
            if (sentBytes == SOCKET_ERROR) {
                cout << "*\t";
                continue;
            }
 
            sockaddr_in fromAddr = { 0 };
            int fromAddrLen = sizeof(fromAddr);
            char recvBuffer[1024] = { 0 };
            int recvBytes = recvfrom(sock, recvBuffer, sizeof(recvBuffer), 0, (sockaddr*)&fromAddr, &fromAddrLen);
            auto endTime = chrono::high_resolution_clock::now();
            int rtt = (int)chrono::duration_cast<chrono::milliseconds>(endTime - startTime).count();

            if (recvBytes == SOCKET_ERROR) {
                cout << "*\t";
            }
            else {
                gotAnyReply = true;
                inet_ntop(AF_INET, &fromAddr.sin_addr, lastReplyIp, sizeof(lastReplyIp));
                lastHost = GetHostName(lastReplyIp);
                cout << rtt << " ms\t";

                unsigned char ipHeaderLen = (recvBuffer[0] & 0x0F) * 4;
                IcmpHeader* icmpReply = (IcmpHeader*)(recvBuffer + ipHeaderLen);
                if (icmpReply->type == ICMP_ECHO_REPLY) {
                    reached = true;
                }
            }
        }

        if (gotAnyReply) {
            if (!lastHost.empty())
                cout << lastHost << " [" << lastReplyIp << "]\n";
            else
                cout << lastReplyIp << "\n";
        }
        else {
            cout << "Превышен интервал ожидания для запроса.\n";
        }
    }

    closesocket(sock);
    WSACleanup();

    cout << "\nТрассировка завершена.\n";
    system("pause");
    return 0;
}
