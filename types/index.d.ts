declare module "ntp2" {
  namespace ntp {

    class NTP {
      time(): void;
      static time(): void;
      static createPacket(): void;
      static createServer(options: any): NTPServer;
    }

    class NTPServer {
      address(): object;
      listen(port?: number, address?: string): void;
      parse(message: Buffer, rinfo: any): void;
      send(rinfo: any, message: any, callback: Function): void;
    }
  }
}