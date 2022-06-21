class Player{
    constructor(username, socketid){
        this.upPressed = false;
        this.downPressed = false;
        this.leftPressed = false;
        this.rightPressed = false;
        this.x = 0;
        this.y = 0;
        this.username = username
        this.socketid = socketid
    }
    move() {
		
		this.x_vel = (this.right_pressed - this.left_pressed);
		this.y_vel = (this.down_pressed - this.up_pressed);
		this.x += this.x_vel * SPEED;
		this.y += this.y_vel * SPEED;
	}
}

export default Player;