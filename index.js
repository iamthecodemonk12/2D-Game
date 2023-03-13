document.addEventListener('DOMContentLoaded', ()=>{
	// Start Code
	main();
});


function main(){
	game = new Game('#mycanvas', _window.width, _window.height);
	game.enemies = Enemy.init(game);

	game.mainloop()
}




class Game extends MainGame{
	init(){
		super.init();
		this.create();
	}
	create(){
		var limit = _window.height + 5 ;//- 300;
		// this.addSprite(new EnemyLog(limit, FAKE.X, FAKE.Y, 30, 70).setColor('red'));

		this.enemies.manager.add(EnemyLog);
		this.addSprite(new Canon(50, 180, 50));

		this.addSprite(new Layer('./images/grass.png', 0, window.innerHeight - 10, window.innerWidth, 10));
	}
	update(){
		super.update();
		// spawn every 10 frames
		var enemyManager = this.enemies.manager;

		this.onEveryXFrame(enemyManager.spawnEnemyPer, ()=>{
			enemyManager.add(EnemyLog); // spawn enemy
		})
		
		this.onEveryXFrame(90, ()=>{
			enemyManager.setSpeed(enemyManager.speed * 1.2 ); // need max speed
		})


		// Power up
		this.onEveryXFrame(randint(500, 1000), ()=>{
			enemyManager.add(ShrinkSpeedApple);
			enemyManager.add(ExplosiveApple);
		})
	}
	onEveryXFrame(xFrame, f){
		if (this.frames % xFrame === 0) f();
	}
}


var Enemy = {
	enemies: [],
	game: null,
	speed: 3,
	spawnEnemyPer: 35, // too low => fast
	// framesPerEnemy: 

	// dimension
	width: 40, height: 80,	
	deathLimit: _window.height,

	init: function(game){
		this.game = game;
		this.enemies.manager = this;
		return this.enemies;
	},
	add: function(type){
		if(not(type)) throw ('need a type to spawn got '+type);
		var range = [randint(0, _window.width-this.width), 0-this.height];
		// if(type.name === 'EnemyLog')
		// 	var enemy = new EnemyLog(this.deathLimit, ...range, this.width, this.height);
		// else if(type.name === 'Apple')
		// 	var enemy = new Apple(this.deathLimit, ...range, this.width, this.height);
		
		var enemy = new type(this.deathLimit, ...range, this.width, this.height);

		enemy.manager = this;
		this.enemies.push(enemy);
		this.game.addSprite(enemy);
	},
	setSpeed(speed){
		this.speed = speed;
		this.enemies.forEach(enemy=>{
			enemy.speed = speed;
		});
	},
	getSpeed(){
		return this.speed;
	}
}

class EnemyLog extends Box{
	constructor(limit, ...others){
		super(...others);
		this.limit = limit;
		this.allowance = 10;
		this.color = 'red';
		this.img = createImg('./images/log.png');
	}
	init(){
		this.speed=this.manager.speed//*Math.random()+1;
	}
	ondraw(){
		this.ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
	}
	update(){
		this.y+=this.speed;
	}
	reset(){
		if(this.y+this.height-this.allowance>=this.limit){
			this.speed=0;
			this.game.removeSprite(this);
		}
	}
	onattack(){
		this.game.removeSprite(this);
	}
}


class PowerUp extends EnemyLog{
	constructor(...a){
		super(...a);
		this.color = 'green';
		this.width = 40;
		this.height = 40;
		// this.img = createImg('./images/red_apple.png');
	}
	init(){
		super.init();
		this.setImage();
	}
	onattack(){
		// what happens when powerup is shot
		super.onattack();
	}
}

class ShrinkSpeedApple extends PowerUp{
	setImage(){
		this.img = createImg('./images/green_apple.png');
	}
	onattack(){
		super.onattack();
		var formerSpeed = this.manager.speed;
		this.manager.setSpeed(1.5);
		window.setTimeout(()=>{
			this.manager.speed = formerSpeed;
		}, 3*MILI_SECONDS);
	}
}


class ExplosiveApple extends PowerUp{
	setImage(){
		this.img = createImg('./images/red_apple.png');
		this.explosionRange = this.game.width/2;
	}
	onattack(){
		var enemies = this.game.enemies;
		for(var i=0; i<enemies.length; i++){
			var enemy = enemies[i],
				vec = new Vector(this, enemy);
			if (vec.distance() <= this.explosionRange && !(enemy instanceof PowerUp)){
				enemy.onattack();
			}
		}
		super.onattack();
	}
}


class Layer extends Box{
	constructor(img, ...x){
		super(...x);
		this.img = new Image();
		this.img.src = img;
	}
	ondraw(){
		this.ctx.drawImage(this.img, ...this.coords())
	}
}

// Player

class Canon extends Circle{
	constructor(x, y, radius){
		super(radius);
	}
	init(){
		this.x = 100;//x;
		this.y = this.game.height;// - this.radius;

		this.endAngle = radians(360);
		this.startAngle = 0;
		this.stroke = false;
		this.reverseClockwise = true;
		this.color = 'lightblue';

		// elevation angle
		this.beginAngle = 90;
		this.currentAngle = 90;

		this.followMouse = true; // weaather to follow mouse x

		// init sprite
		this.spriteInit();
		this.dispatchEvents()
	}
	spriteInit(){
		this.canonGun = new CanonGun(this, this.x, this.y, 15, 35)
		this.game.addSprite(this.canonGun);
	}
	addSprite(sprite, name){
		this[name] = sprite;
	}
	dispatchEvents(){
		this.game.canvas.addEventListener('mousemove', (ev)=>{
			if(this.followMouse){
				this.x = this.canonGun.x = ev.clientX;
			}
		});
	}
}

class CanonGun extends Box{
	constructor(canon, x,y,w,h){
		super(x,y,w,h);
		this.canon = canon;

		this.color='crimson';
	}

	init(){
		this.angle = this.canon.beginAngle; // elevation angle
		this.dispatchEvents();		
	}

	ondraw(){
		var [x, y, w, h] = this.coords();
		rotate(this, this.angle, this.canon.radius/-h, (x, y, width, height)=>{
			this.ctx.fillStyle = this.color;
			this.ctx.fillRect(x, y, width, height);
		});
		
	}

	update(){
		// reset coordinates to follow canon
		// this.angle++;
		this.x = this.canon.x;
		this.y = this.canon.y;
	}

	dispatchEvents(){
		// reposition gun
		this.game.canvas.addEventListener('mousemove', (e)=>{
			if(e.shiftKey){
				this.angle = new Vector(this, e).baseAngle();
				this.canon.followMouse=false;
			}else{
				this.canon.followMouse=true;
				this.angle = 90;
			}
		});
		// fire gun
		this.game.canvas.addEventListener('click', (e)=>{
			this.shoot();
		});
	}

	shoot(){
		let bullet = new CanonBullet(this.x, this.y);
		bullet.canon=this.canon;
		bullet.gunHeight=this.height;
		bullet.angle = this.angle;
		this.game.addSprite(bullet);
	}
}

// player bullet
class CanonBullet extends Box{
	constructor(...args){
		super(...args);
		this.width=15;
		this.height=15;
	}
	ondraw(){
		var boxH = 15;
		var boxW = 15;
		var sl = this.canon.radius + this.gunHeight + boxH;
		var [dx, dy] = [sl * -Math.cos(radians(this.angle)), sl * Math.sin(radians(this.angle))]
		var [x, y] = [this.x-dx-(boxW/2), this.y-dy];
		// this.game.addSprite(new Box(dx-this.x, dy-this.y, 10, 15).setColor('purple'));
		this.ctx.fillStyle='red';
		this.ctx.fillRect(x, y, boxW, boxH);
	}
	update(){
		this.x+=this.vx;
		this.y+=this.vy;
	}
	init(){
		this.speed = 25;
		this.vx = this.speed * Math.cos(radians(this.angle));
		this.vy = this.speed * -Math.sin(radians(this.angle));
	}
	reset(){
		for(var i=0; i<this.game.enemies.length; i++){
			var enemy = this.game.enemies[i];
			if(this.hitting(enemy)){
				this.attack(enemy);
			}
		}
		if(this.outofbounds()){
			this.game.removeSprite(this.id);
		}
	}
	onhitting(){
		this.game.enemies.forEach(enemy=>{
			console.log(enemy);
		});
	}
	hitting(sprite){
		return detectCollusion(this, sprite);
	}
	attack(enemy){
		enemy.onattack();
		// this.game.removeSprite(this.id);
	}
	outofbounds(){
		// s = this.game.
		// this.y + this.height > 
		var a = this.game;
		a.x = a.y = 0;
		return !(detectCollusion(this, this.game));
	}
}