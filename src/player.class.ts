class Player{
    upPressed: boolean;
    downPressed: boolean;
    leftPressed: boolean;
    rightPressed: boolean;
    x: number;
    y: number;
    username: string;
    socketid: string;
    constructor(username:string, socketid:string){
        this.upPressed = false;
        this.downPressed = false;
        this.leftPressed = false;
        this.rightPressed = false;
        this.x = 0;
        this.y = 0;
        this.username = username
        this.socketid = socketid
    }

}

export default Player;