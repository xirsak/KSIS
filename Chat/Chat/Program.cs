using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace p2p_Chat
{
	public enum MessageType : byte
	{
		SendName = 1,
		ChatMessage = 2,
		UserConnected = 3,
		UserDisconnected = 4
	}

	public class ChatNode
	{
		private string name;
		private IPAddress localAddress;
		private int udpPort = 9000;
		private int tcpPort = 9001;

		private UdpClient udpClient;
		private TcpListener tcpListener;
		private Dictionary<string, TcpClient> peers = new Dictionary<string, TcpClient>();

		public ChatNode(string name, string ip)
		{
			this.name = name;
			this.localAddress = IPAddress.Parse(ip);
		}

		public void Start()
		{
			StartUDPListener();
			StartTCPListener();

			SendHelloUDP();

			new Thread(HandleInput).Start();
		}

		private void StartUDPListener()
		{
			udpClient = new UdpClient(new IPEndPoint(localAddress, udpPort));
			udpClient.EnableBroadcast = true;

			new Thread(() =>
			{
				while (true)
				{
					IPEndPoint remoteEP = new IPEndPoint(IPAddress.Any, udpPort);
					byte[] data = udpClient.Receive(ref remoteEP);
					string remoteName = Encoding.UTF8.GetString(data);

					if (!remoteEP.Address.Equals(localAddress))
					{
						HistoryLogger.Log($"Обнаружен узел: {remoteName} ({remoteEP.Address})");
						ConnectToPeer(remoteEP.Address.ToString());
					}
				}
			}).Start();
		}

		private void StartTCPListener()
		{
			tcpListener = new TcpListener(localAddress, tcpPort);
			tcpListener.Start();

			new Thread(() =>
			{
				while (true)
				{
					TcpClient client = tcpListener.AcceptTcpClient();
					new Thread(() => HandleTCPClient(client)).Start();
				}
			}).Start();
		}

		private void ConnectToPeer(string ip)
		{
			if (peers.ContainsKey(ip)) return;

			try
			{
				TcpClient client = new TcpClient();
				client.Connect(IPAddress.Parse(ip), tcpPort);
				peers[ip] = client;

				SendMessage(client.GetStream(), MessageType.SendName, name);
				SendMessage(client.GetStream(), MessageType.UserConnected, name);
				ReceiveMessages(client, ip);
			}
			catch
			{
				HistoryLogger.Log($"Не удалось подключиться к {ip}");
			}
		}

		private void HandleTCPClient(TcpClient client)
		{
			string remoteIP = ((IPEndPoint)client.Client.RemoteEndPoint).Address.ToString();
			peers[remoteIP] = client;

			SendMessage(client.GetStream(), MessageType.UserConnected, name);
			ReceiveMessages(client, remoteIP);
		}

		private void ReceiveMessages(TcpClient client, string ip)
		{
			NetworkStream stream = client.GetStream();
			try
			{
				while (true)
				{
					int type = stream.ReadByte();
					if (type == -1) break;

					byte[] lenBuf = new byte[4];
					stream.Read(lenBuf, 0, 4);
					int length = BitConverter.ToInt32(lenBuf, 0);

					byte[] data = new byte[length];
					stream.Read(data, 0, length);
					string content = Encoding.UTF8.GetString(data);

					switch ((MessageType)type)
					{
						case MessageType.SendName:
							HistoryLogger.Log($"Пользователь {content} ({ip}) присоединился.");
							break;
						case MessageType.ChatMessage:
							HistoryLogger.Log($"Сообщение от {ip}: {content}");
							break;
						case MessageType.UserConnected:
							HistoryLogger.Log($"Пользователь {content} ({ip}) подключился.");
							break;
						case MessageType.UserDisconnected:
							HistoryLogger.Log($"Пользователь {content} ({ip}) отключился.");
							peers.Remove(ip);
							break;
					}
				}
			}
			catch
			{
				HistoryLogger.Log($"Пользователь {ip} отключился.");
				peers.Remove(ip);
			}
		}

		private void SendMessage(NetworkStream stream, MessageType type, string content)
		{
			byte[] data = Encoding.UTF8.GetBytes(content);
			byte[] length = BitConverter.GetBytes(data.Length);

			stream.WriteByte((byte)type);
			stream.Write(length, 0, 4);
			stream.Write(data, 0, data.Length);
		}

		private void HandleInput()
		{
			while (true)
			{
				string line = Console.ReadLine();
				if (string.IsNullOrWhiteSpace(line)) continue;

				if (line.ToLower() == "exit")
				{
					foreach (var peer in peers.Values)
					{
						SendMessage(peer.GetStream(), MessageType.UserDisconnected, name);
					}

					HistoryLogger.Log("Вы покинули чат.");
					Environment.Exit(0);
				}

				foreach (var peer in peers.Values)
				{
					SendMessage(peer.GetStream(), MessageType.ChatMessage, line);
				}

				HistoryLogger.Log($"Вы: {line}");
			}
		}

		private void SendHelloUDP()
		{
			byte[] data = Encoding.UTF8.GetBytes(name);
			udpClient.Send(data, data.Length, new IPEndPoint(IPAddress.Broadcast, udpPort));
		}

		class Program
		{
			static void Main(string[] args)
			{
				Console.Write("Введите ваше имя: ");
				string name = Console.ReadLine();

				Console.Write("Введите ваш локальный IP-адрес: ");
				string ip = Console.ReadLine();

				if (!System.Net.IPAddress.TryParse(ip, out _))
				{
					Console.WriteLine("Неверный IP-адрес. Завершение программы.");
					return;
				}

				ChatNode node = new ChatNode(name, ip);
				node.Start();

				Console.WriteLine($"[{name}] Чат запущен. Введите сообщения:");
			}
		}
	}
}
