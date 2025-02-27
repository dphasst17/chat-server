import { Inject, Injectable } from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ChatRequest, Notification } from 'src/chat.interface';
@Injectable()
export class ChatService {
    constructor(
        @Inject('NATS_SERVICE') private natsClient: ClientProxy,
        private readonly chatRepository: ChatRepository
    ) { }
    private getUserInfo = async (idUser: string, value: any) => {
        try {
            const result = await firstValueFrom(this.natsClient.send({ cmd: 'user_get_info' }, { idUser, rValue: value }))
            return result
        }
        catch (error) {
            return error
        }
    }
    async chatChecked() {
        return this.chatRepository.chatChecked();
    }
    async createChat(data: any) {
        const _id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        const dataCreate = {
            ...data,
            owner: data.type === "group" ? data.user[0] : "",
            userAction: data.user.map((u: string) => {
                return {
                    idUser: u,
                    date: null
                }
            }),
            _id: _id
        }
        const result = await this.chatRepository.createChat(dataCreate)
        return { status: 201, data: result }
    }
    async chatInsert(data: ChatRequest) {
        const result = await this.chatRepository.chatInsert(data)
        return { status: 201, data: result }
    }
    async notiInsert(data: Notification) {
        const result = await this.chatRepository.notiInsert(data)
        return { status: 201, data: result }
    }
    async leaveGroupChat(data: { idUser: string, idChat: string }) {
        const result = await this.chatRepository.userLeaveGroupChat(data.idUser, data.idChat)
        if (!result) {
            return { status: 400, message: "Leave group chat is failed" }
        }
        return { status: 200, data: result }
    }
    async getChatByUser(idUser: string) {
        try {
            const data = await this.chatRepository.getChatByUser(idUser)
            const result = await Promise.all(
                data.map(async (item: any) => {
                    const id = item.user.filter((u: string) => u !== idUser)[0];
                    const name = id && await this.getUserInfo(id, 'name');
                    const avatar = id && await this.getUserInfo(id, 'avatar');
                    const nullMessage = item.type === "group" ? `<p>${item.notification}</p>` : null
                    return {
                        ...item,
                        lastMessage: item.lastMessage
                            ? item.lastMessage.message
                            : (nullMessage),
                        name: item.name ? item.name : name,
                        avatar: item.avatar ? item.avatar : avatar
                    };
                })
            );
            return { status: 200, data: result }
        }
        catch (error) {
            return { status: 500, message: error }
        }
    }
    async getChatDetailInfo(idChat: string) {
        try {
            const data = await this.chatRepository.getChatDetailInfo(idChat)
            const result = {
                _id: data._id,
                name: data.name,
                avatar: data.avatar,
                owner: data.owner,
                time: data.time,
                type: data.type,
                notification: data.notification,
                user: await Promise.all(
                    data.user.map(async (idUser: string) => {
                        const name = await this.getUserInfo(idUser, 'name');
                        const avatar = await this.getUserInfo(idUser, 'avatar');
                        return {
                            idUser: idUser,
                            name: name,
                            avatar: avatar
                        }
                    })
                ),
                userAction: data.userAction
            }
            return { status: 200, data: result }
        }
        catch (error) {
            return { status: 500, message: error }
        }
    }
    async getChatDetail(idUser: string, idChat: string, page: number, limit: number) {
        const count = await this.chatRepository.getCountChatDetail(idChat, "chat")
        const result = await this.chatRepository.getChatDetail(idUser, idChat, page, limit)
        return {
            status: 200, data: {
                total: count ? count[0]?.count : 0,
                data: result ? await Promise.all(
                    result.map(async (r: any) => {
                        return {
                            ...r,
                            name: await this.getUserInfo(r.sender, 'name'),
                            avatar: await this.getUserInfo(r.sender, 'avatar')
                        }
                    })
                ) : []
            }
        }
    }
    async getChatImageById(idUser: string, idChat: string, page: number, limit: number) {
        const count = await this.chatRepository.getCountChatDetail(idChat, "chatImage")
        const result = await this.chatRepository.getChatImageById(idUser, idChat, page, limit)
        return {
            status: 200, data: {
                total: count ? count[0]?.count : 0,
                data: result
            }
        }

    }
    async getNotiByChat(idChat: string, page: number, limit: number) {
        const count = await this.chatRepository.getCountChatDetail(idChat, "notification")
        const result = await this.chatRepository.getNotiByChatId(idChat, page, limit)
        return {
            status: 200, data: {
                total: count ? count[0]?.count : 0,
                data: result ? await Promise.all(
                    result.map(async (r: Notification) => {
                        const actorName = await this.getUserInfo(r.actorId, 'name')
                        const targetName = r.targetId && await this.getUserInfo(r.targetId, 'name')
                        return {
                            ...r,
                            actorName: actorName,
                            targetName: targetName ?? ""
                        }
                    })
                ) : []
            }
        }
    }
    /* 
        body data for reaction message:
        {
            type?: string
            detail?: this is old array emoji [
                {
                    emoji?: string
                    idUser?: string
                },...
            ]
            emoji?: string
        }
    */
    async chatUpdate(id: string, idUser: string, data: any) {
        const convertData = data.type === "chat" && [
            ...data.detail,
            {
                emoji: data.emoji,
                idUser: idUser
            }
        ]
        const query = data.type === "chat" ? this.chatRepository.chatUpdate(id, { emoji: convertData }) : this.chatRepository.chatInfoUpdate(id, data)
        const update = await query
        if (!update) {
            return {
                status: 400,
                message: "Update chat is failed"
            }
        }
        return { status: 200, message: "Update chat is success", data: data.type === "chat" ? convertData : [] }
    }
    async chatImages(data: { images: string[], idChat: string, idUser: string, name: string, }) {
        const convertData = data.images.map((item: any) => {
            return {
                image: item,
                idChat: data.idChat,
                idUser: data.idUser,
                name: data.name,
                date: new Date()
            }
        })
        const insert = await this.chatRepository.chatImages(convertData)
        return { status: 201, data: insert }
    }
}
