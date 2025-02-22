import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'NATS_SERVICE',
                transport: Transport.NATS,
                options: {
                    servers: [`nats://${process.env.NATS_URL ? process.env.NATS_URL : 'nats'}`],
                },
            },
        ]),
    ],
    exports: [
        ClientsModule.register([
            {
                name: 'NATS_SERVICE',
                transport: Transport.NATS,
                options: {
                    servers: [process.env.NATS_URL],
                },
            },
        ]),
    ],
})
export class NatsClientModule { }