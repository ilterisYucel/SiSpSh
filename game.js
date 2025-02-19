var w = window,
	d = document,
	e = d.documentElement,
	g = d.getElementsByTagName('body')[0],
	x = w.innerWidth || e.clientWidth || g.clientWidth,
	y = w.innerHeight|| e.clientHeight|| g.clientHeight;

var path = "./assets/images/";
var level = getAllUrlParams().level;
var pShip, app, bg, energyCounter, counterStep, proton;
var pBullets = [];
var eBullets = [];
var eShips = [];
var meteors = [];
var radars = [];
var items = [];
var stations = [];
var warps = [];

var adLoc = 0.85 * y;
var factor = (adLoc) / x;
var xStep = x / 10;
var yStep = xStep * factor;
var vFactorX = xStep / 60;
var vFactorY = yStep / 60;

var itemID = 0;

var windowBounds = {
						x : 0,
						y : 0,
						width : x,
						height : adLoc
					};
					
var containerBounds = {
	x : -x,
	y : -adLoc,
	width : 3*x,
	height : 3*adLoc
};
					
var rotationParams = {
						f0: {
							x : 0.5 * x,
							y : 0.4 * y
						},
						f1: {
							x : 0.5 * x,
							y : 0.6 * y
						},
					 };

var matrix;
var data;

class Item extends PIXI.Sprite{
	constructor(texture, collectFunc = null){
		super(texture);
		this.anchor.set(0.5);
		this.collectFunc = collectFunc;
	}
	
	collect(){
		this.collectFunc();
		container.removeChild(this);
	}
}

class Warp extends PIXI.Sprite{
	constructor(texture, location){
		super(texture);
		this.anchor.set(0.5);
		this.location = location;
	}
	
	warp(){
		loadLevel(this.location);
	}
}

class bullet extends PIXI.Sprite{
	constructor(texture, rotation, range = 100){
		super(texture);
		this.anchor.set(0.5);
		this.rotation = rotation;
		this.initialPos = {
			x: this.x,
			y: this.y
		};
		this.range = range;
	}
}

class energyBullet extends bullet{
	constructor(texture, rotation, effect = 10, factor = 2, range = 100){
		super(texture, rotation, range);
		this.factor = factor;
		this.effect = effect * factor;
		this.speedX = factor * vFactorX;
		this.speedY = factor * vFactorY;
	}
	
	move(){
		this.x += this.speedX * Math.sin(this.rotation);
		this.y -= this.speedY * Math.cos(this.rotation);			   
	}			
}


class Ship extends PIXI.Sprite{

	constructor(texture, energy = 50, factor = 1){
		super(texture);
		this.factor = factor;
		this.speedX = factor * vFactorX;
		this.speedY = factor * vFactorY;
		this.energy = energy;
		this.anchor.set(0.5);
	}
}

class Station extends PIXI.Sprite{
    constructor(texture, energy = 500, factor = 1){
        super(texture);
        this.energy = energy;
        this.factor = factor
        this.anchor.set(0.5);
    }
    
    hit(bullet){
		this.energy -= bullet.effect;
	}
}

class Station1 extends Station{
    constructor(texture, energy = 500, factor = 1, shipsTextures = {}, bulletTextures = {}, radars = []){
        super(texture, energy, factor);
        this.shipsTextures = shipsTextures;
        this.bulletTextures = bulletTextures;
        this.radars = radars;
        this.intervalId = 0;
        this.readyLauncher = true;
    }
    
    hit(bullet){
        super.hit(bullet);
        this.eFire(bullet.rotation, bullet.x, bullet.y)
        
    }
    
    eFire(rotation, x, y){
        
        var fireX;
        var fireY;
        var fireRotation = rotation + Math.PI;
        

        if(rotation >= 0 && rotation < Math.PI / 2){
            fireX = x;
            fireY = this.y + this.height / 2;
            
        }    

        
        if(rotation >= Math.PI / 2 && rotation < Math.PI){
            fireX = this.x;
            fireY = y;
            
            
        }
        
        if(rotation >= Math.PI && rotation < 3 * Math.PI / 2){
            fireX = x;
            fireY = this.y - this.height / 2;
            
        }
        
        if(rotation >= 3 * Math.PI / 2 && rotation < 2 * Math.PI){
            fireX = this.x;
            fireY = y;
            
        }

        
		if(this.readyLauncher){
		       
			var eBullet = new energyBullet(this.bulletTextures["energyBullet"], fireRotation);
			console.log(eBullet.effect);
			eBullet.width = xStep / 8;
			eBullet.height = xStep / 2;
			eBullet.x = fireX;
			eBullet.y = fireY;
			eBullet.initialPos.x = fireX;
			eBullet.initialPos.y = fireY;
			eBullet.range = 10 * xStep;
			container.addChild(eBullet);
			eBullets.push(eBullet);
			this.readyLauncher = false;
		}
    
    }

    
    controlStatus(){
		this.intervalId = setInterval(function(){
			this.readyLauncher = true;
		}.bind(this),1000);
	}
}

class playerShip extends Ship{

	constructor(texture, speed = 1, energy = 50, factor = 1, itemList = {}, 
					bulletTextures = {}, deathItemsTextures = [], effectTextures = {}){
		super(texture, energy, factor);
		this.itemList = itemList;
		this.bulletTextures = bulletTextures;
		this.deathItemsTextures = deathItemsTextures;
		this.effectTextures = effectTextures;
		this.readyLauncher = true;
		this.intervalId = 0;
		this.alive = true;
		this.actionStatus = null;
		this.dir = 0;
		this.beforeRotation = 0;
		this.meteorCatcherStatus = 0;
		this.invisibilityStatus = 0;
		this.meteorBreakerStatus = 0;
	}
	
	move(direction){
		if(direction == 1){
			this.rotation = Math.PI;
			if (container.y > -adLoc && this.y + container.y >= adLoc/2) {
				container.y -= this.speedY;
			}
			this.y += this.speedY;
		}
		
		if(direction == 2){
			this.rotation = 0;
			if (container.y < adLoc && this.y + container.y <= adLoc/2) {
				container.y += this.speedY;
			}
			this.y -= this.speedY;
		}
		
		if(direction == 3){
			this.rotation = Math.PI / 2;
			if (container.x > -x && this.x + container.x >= x/2) {
				container.x -= this.speedX;
			}
			this.x += this.speedX;
		}
		
		if(direction == 4){
			this.rotation = 3 * Math.PI / 2;
			if (container.x < x && this.x + container.x <= x/2) {
				container.x += this.speedX;
			}
			this.x -= this.speedX;
		}
		if(this.dir && this.changeDirection() == "Y"){
			var motor = this.getMotor1();
			var motor1 = this.getMotor2();
			playerMotors(motor.x + container.x, motor.y + container.y, (180/Math.PI) * (this.rotation + Math.PI/2));
			playerMotors(motor1.x + container.x, motor1.y + container.y, (180/Math.PI) * (this.rotation - Math.PI/2));
		}
		if(this.dir && this.changeDirection() == "X"){
			var motor = this.getMotor0();
			var motor1 = this.getMotor3();
			playerMotors(motor.x + container.x, motor.y + container.y, (180/Math.PI) * (this.rotation - Math.PI/2));
			playerMotors(motor1.x + container.x, motor1.y + container.y, (180/Math.PI) * (this.rotation + Math.PI/2));
		}
		
	}
	
	moveItems(direction){
		var breakerLoc = this.getBreakerLoc();
		Object.values(this.itemList).forEach(function(obj){
				if(obj){
					obj.rotation = this.rotation;
					obj.x = breakerLoc.x + obj.distance * Math.sin(this.rotation);
					obj.y = breakerLoc.y - obj.distance * Math.cos(this.rotation); 
				}
		}.bind(this));
	}
	
	changeDirection(direction){
		var temp = this.beforeRotation - this.rotation;
		if(temp == 0){
			return false;
		}
		else if (temp > Math.PI || temp < 0 && temp > -Math.PI){
			return "X";
		} else {
			return "Y";
		}
		/*else if((this.beforeRotation - this.rotation) > 0){
			return "Y";
		}*/
	}
	
	eFire(){
	    if(this.invisibilityStatus && !this.itemList["fireRegulator"]){
	        this.invisibilityStatus = 0;
	        this.alpha = 1.0;
	    }
	    
	    if(this.invisibilityStatus && this.itemList["fireRegulator"]){
	    	this.invisibilityStatus = 1;
	        this.alpha = 0.5;
	    }
		if(this.readyLauncher){
        
			var eBullet = new energyBullet(this.bulletTextures["energyBullet"], this.rotation);
			eBullet.width = xStep / 8;
			eBullet.height = xStep / 2;
			eBullet.x = this.x;
			eBullet.y = this.y;
			eBullet.initialPos.x = this.x;
			eBullet.initialPos.y = this.y;
			eBullet.range = 10 * xStep;
			eBullet.alpha = this.alpha;
			container.addChild(eBullet);
			pBullets.push(eBullet);
			this.readyLauncher = false;
		}
	}
	
	death(){
	    if(this.meteorCatcherStatus && this.itemList["catchedMeteor"] && this.itemList["catchedMeteor"].status != "death" ){
	        this.meteorCatcherStatus = 0;
	        container.removeChild(this.itemList["catchItem"]);
		    this.itemList["catchItem"] = null;
		    this.itemList["catchedMeteor"].state = "free";
		    this.itemList["catchedMeteor"].calculateRotParams();
		    this.uncatch();
	    }
	    if(this.meteorCatcherStatus && !this.itemList["catchedMeteor"]){
	        this.meteorCatcherStatus = 0;
	        container.removeChild(this.itemList["catchItem"]);
		    this.itemList["catchItem"] = null;
	    }
	    
	    if(this.meteorBreakerStatus){
	        this.meteorBreakerStatus = 0;
	        container.removeChild(this.itemList["meteorBreakItem"]);
		    this.itemList["meteorBreakItem"] = null;
	    }
		this.deathItemsTextures.forEach(function(texture){
			var sprite = new PIXI.Sprite(texture);
			sprite.x = randomInt(this.x - this.width / 2, this.x + this.width /2);
			sprite.y = randomInt(this.y - this.height / 2, this.y + this.height /2);
			sprite.width = xStep / 2;
			sprite.height = xStep / 2;
			sprite.anchor.set(0.5);
			container.addChild(sprite);
		}.bind(this));
	}
	
	getBreakerLoc(){
		if(this.rotation == Math.PI){
			return {x : this.x, y : this.y + this.height / 2};
		}
		
		else if(this.rotation == 0){
			return {x : this.x, y : this.y - this.height / 2};
		}
		else if(this.rotation == Math.PI / 2){
			return {x : this.x + this.width / 2, y : this.y};
		}
		else if(this.rotation == 3 * Math.PI / 2){
			return {x : this.x - this.width / 2, y : this.y};
		}
	}
	
	getMotor0(){
		if(this.rotation == Math.PI){
			return {x : this.x + this.width / 2, y : this.y + this.height / 2};
		}
		
		else if(this.rotation == 0){
			return {x : this.x - this.width / 2, y : this.y - this.height / 2};
		}
		else if(this.rotation == Math.PI / 2){
			return {x : this.x + this.width / 2, y : this.y - this.height / 2};
		}
		else if(this.rotation == 3 * Math.PI / 2){
			return {x : this.x - this.width / 2, y : this.y + this.height / 2};
		}
	}
		
	getMotor1(){
		if(this.rotation == Math.PI){
			return {x : this.x - this.width / 2, y : this.y + this.height / 2};
		}
		
		else if(this.rotation == 0){
			return {x : this.x + this.width / 2, y : this.y - this.height / 2};
		}
		else if(this.rotation == Math.PI / 2){
			return {x : this.x + this.width / 2, y : this.y + this.height / 2};
		}
		else if(this.rotation == 3 * Math.PI / 2){
			return {x : this.x - this.width / 2, y : this.y - this.height / 2};
		}	  
	}
	
	getMotor2(){
		if(this.rotation == Math.PI){
			return {x : this.x + this.width / 2, y : this.y - this.height / 2};
		}
		
		else if(this.rotation == 0){
			return {x : this.x - this.width / 2, y : this.y + this.height / 2};
		}
		else if(this.rotation == Math.PI / 2){
			return {x : this.x - this.width / 2, y : this.y - this.height / 2};
		}
		else if(this.rotation == 3 * Math.PI / 2){
			return {x : this.x + this.width / 2, y : this.y + this.height / 2};
		}	  
	}
	
	getMotor3(){
		if(this.rotation == Math.PI){
			return {x : this.x - this.width / 2, y : this.y - this.height / 2};
		}
		
		else if(this.rotation == 0){
			return {x : this.x + this.width / 2, y : this.y + this.height / 2};
		}
		else if(this.rotation == Math.PI / 2){
			return {x : this.x - this.width / 2, y : this.y + this.height / 2};
		}
		else if(this.rotation == 3 * Math.PI / 2){
			return {x : this.x + this.width / 2, y : this.y - this.height / 2};
		}	  
	}
	
	collide(meteor){
		var slope = Math.PI / 2 + calculateSlope(pShip, meteor);
		
		meteorCrashEffect(container.x + meteor.x, container.y + meteor.y, (180/Math.PI) * (Math.PI + slope), 1);
		
		this.x += pShip.speedX * Math.sin(slope);
		this.y -= pShip.speedY * Math.cos(slope);
		
		this.moveItems();
		
		this.energy -= meteor.damage;
		meteor.strength -= meteor.damage;	
	}
	
	catchMeteor(meteor){
		meteor.state = "catched";
		this.itemList["catchedMeteor"] = meteor;
		this.itemList["catchedMeteor"].distance = xStep;	
	}
	
	uncatch(){
		this.itemList["catchedMeteor"] = null;		  
		
	}
	
	controlStatus(){
		this.intervalId = setInterval(function(){
			this.readyLauncher = true;
			if(this.invisibilityStatus){
			    this.energy -= Math.floor(1 / this.factor);
			}
			if(this.meteorCatcherStatus){
			    this.energy -= Math.floor(1 / this.factor);
			}
		}.bind(this),1000);
	}
	
	
}

class Enemy extends Ship{

	constructor(texture, energy = 50, factor = 1, itemList = [], 
					bulletTextures = {}, deathItemsTextures = [], effectTextures={}, radars = []){
		super(texture, energy, factor);
		this.itemList = itemList;
		this.bulletTextures = bulletTextures;
		this.deathItemsTextures = deathItemsTextures;
		this.effectTextures = effectTextures;
		this.radars = radars;
		this.readyLauncher = true;
		this.prevRotation = null;
		this.prevVX = null;
		this.prevVY = null;
		this.hitCount = 0;
		this.crashTime = 0;
		this.crashId = 0;
		
	}
	
	eFire(){
		if(this.readyLauncher){
			var eBullet = new energyBullet(this.bulletTextures["energyBullet"], this.rotation);
			eBullet.width = xStep / 8;
			eBullet.height = xStep / 2;
			eBullet.x = this.x;
			eBullet.y = this.y;
			eBullet.initialPos.x = this.x;
			eBullet.initialPos.y = this.y;
			eBullet.range = 10 * xStep;
			container.addChild(eBullet);
			eBullets.push(eBullet);
			this.readyLauncher = false;
		}
	}
	
	radar(){
		this.radars.filter(function(radar){
				if(hitTestRectangle(pShip, radar)){
					var tempRotation = this.rotation;
					this.rotation = Math.PI/2 + /*tempRotation +*/ calculateSlope(pShip, radar.obj);
					this.eFire();
					this.factor = 1;
					this.rotation = tempRotation;
				}
				
				if(this.energy == 0){
					container.removeChild(radar);
					return false;
				}
				
				return true;
			}.bind(this));
	}
	
	
	hit(bullet){
		this.energy -= bullet.effect;
	}
	
	collide(meteor) {

		var slope = Math.PI / 2 + calculateSlope(this, meteor);
		
		if(meteor.state == "free"){
			particalEffect(container.x + this.x, container.y + this.y, (180/Math.PI) * (Math.PI + slope));
			meteorCrashEffect(container.x + meteor.x, container.y + meteor.y, (180/Math.PI) * (Math.PI + slope), 1);
			meteor.move = Meteor.pushedMoveMaker.bind(meteor)(xStep/10,Math.PI/2+slope,30);
		
			this.x += this.speedX * Math.sin(slope);
			this.y -= this.speedY * Math.cos(slope);
			this.radars.forEach(function(radar){
				radar.x += this.speedX * Math.sin(slope);
				radar.y -= this.speedY * Math.cos(slope);
			}.bind(this));
		
			this.energy -= meteor.damage;
			meteor.strength -= meteor.damage;
		}
		
		else if(meteor.state == "catched"){
			particalEffect(container.x + this.x, container.y + this.y, (180/Math.PI) * (Math.PI + slope));
			
			this.x += this.speedX * Math.sin(slope);
			this.y -= this.speedY * Math.cos(slope);
			this.radars.forEach(function(radar){
				radar.x += this.speedX * Math.sin(slope);
				radar.y -= this.speedY * Math.cos(slope);
			}.bind(this));
			
			this.energy -= meteor.strength;
			pShip.uncatch();
			meteor.strength = 0;
		}
	   
	}
	
	dealTeamCrash(){
		var curTime;
		curTime = new Date().getTime();
		eShips.forEach(function(eShip){
			if(calculateDistance(eShip, this) < 1.5 * xStep && eShip.id != this.id && (curTime-this.crashTime > 1000 || eShip.id != this.crashId) ){
				playerMotors(this.x + container.x, this.y + container.y, (180/Math.PI) * (this.rotation), 2);
				this.crashId = eShip.id;
				this.crashTime = curTime;
				this.rotation += Math.PI;
				this.x += this.speedX * Math.sin(this.rotation);
				this.y -= this.speedY * Math.cos(this.rotation);
			}
		}.bind(this));
	}
	
	death(){
		this.deathItemsTextures.forEach(function(texture){
			var sprite = new PIXI.Sprite(texture);
			sprite.x = randomInt(this.x - this.width / 2, this.x + this.width /2);
			sprite.y = randomInt(this.y - this.height / 2, this.y + this.height /2);
			sprite.width = xStep / 2;
			sprite.height = xStep / 2;
			sprite.anchor.set(0.5);
			container.addChild(sprite);
		}.bind(this));
		
		if(this.dropItem) {
		   	this.dropItem();
		}
		
		this.radars.filter(function(radar){
			container.removeChild(radar);
			return false;
		});
	}
	
	controlStatus(){
		this.intervalId = setInterval(function(){
			this.readyLauncher = true;
		}.bind(this),1000);
	}
}

class Radar extends PIXI.Sprite{
	
	constructor(texture, obj, rotation){
		super(texture);
		this.obj = obj;
		this.anchor.set(0.5);
		this.rotation = rotation;
	}
}

class Meteor extends PIXI.Sprite{

	constructor(texture, breakItemList = []){
		super(texture);
		this.breakItemList = breakItemList;
		this.anchor.set(0.5);
		this.strength = 20;
		this.damage = 5;
		this.t = 0;
		this.a = 0;
		this.b = 0;
		this.s = 0;
		this.state = "free";
		this.transporter = null;
		this.moveFrames = 0;
		
		// functions
		this.move = Meteor.defaultMove.bind(this);
	}
	
	breakIt(){
		var frame = [];
		
		var anim = new PIXI.extras.AnimatedSprite(this.breakItemList);
		
		anim.x = this.x; 
		anim.y = this.y;
		anim.anchor.set(0.5);
		anim.animationSpeed = 0.2;
		anim.play();
		
		container.addChild(anim);
		
		setTimeout(function(){
			container.removeChild(anim);
		},1000);
	}
	
	calculateRotParams() {
		this.t = Math.atan2(this.y - rotationParams.o.y, this.x - rotationParams.o.x) + rotationParams.e;
		
		var m_t = {
			x : (this.x-rotationParams.o.x)*rotationParams.cos_e + (this.y-rotationParams.o.y)*rotationParams.sin_e,
			y : (this.y-rotationParams.o.y)*rotationParams.cos_e + (this.x-rotationParams.o.x)*rotationParams.sin_e
		};
		
		var c_2 = (((rotationParams.f0_t_x - rotationParams.f1_t_x) ** 2) / 4);
		var temp = (m_t.x ** 2) + (m_t.y ** 2) - c_2;
		
		var b_2 = ( temp + Math.sqrt( temp ** 2 + 4*c_2*(m_t.y ** 2)) ) / 2;
		this.b = Math.sqrt(b_2);
		this.a = Math.sqrt(b_2 + c_2);
	}
	
	static defaultMove() {
		this.t = (this.t + this.s) % (2*Math.PI);
		
		var m_t = {
			x : this.a * Math.cos(this.t),
			y : this.b * Math.sin(this.t)
		};
		
		this.x = m_t.x*rotationParams.cos_e + m_t.y*rotationParams.sin_e + rotationParams.o.x;
		this.y = m_t.y*rotationParams.cos_e - m_t.x*rotationParams.sin_e + rotationParams.o.y;
	}
	
	static pushedMoveMaker(speed, direction, frames) {
		this.moveFrames = frames;
		if (speed.length == frames) {
			return function(){
				this.x += speed[frames - this.moveFrames] * Math.cos(direction);
				this.y += speed[frames - this.moveFrames] * Math.sin(direction);
				this.moveFrames--;
				if (this.moveFrames <= 0) {
					this.calculateRotParams();
					this.move = Meteor.defaultMove.bind(this);
				}
			};
		} else {
			return function(){
				this.x += speed * Math.cos(direction);
				this.y += speed * Math.sin(direction);
				this.moveFrames--;
				if (this.moveFrames <= 0) {
					this.calculateRotParams();
					this.move = Meteor.defaultMove.bind(this);
				}
			};
		}
	}
	death(){
		meteorCrashEffect(container.x + this.x, container.y + this.y, (180/Math.PI) * (Math.PI * 2), 2);
		container.removeChild(this);
		if (this.state === "catched") {
			pShip.uncatch();
		}
		
		this.x = -3*x;
		this.y = -3*adLoc;
		this.state = "death";
	}
	
	resolveSelfCrash(){
		meteors.forEach(function(meteor){
			if(hitTestRectangle(this, meteor) && this.id != meteor.id && (this.state == "free" && meteor.state == "free")){
				var slope = Math.PI / 2 + calculateSlope(this, meteor);
	
				meteorCrashEffect(container.x + this.x, container.y + this.y, (180/Math.PI) * (Math.PI + slope), 1);
				meteorCrashEffect(container.x + meteor.x, container.y + meteor.y, (180/Math.PI) * (2 * Math.PI + slope), 1);
				this.x += this.speedX * Math.sin(slope);
				this.y -= this.speedY * Math.cos(slope);
	
				this.strength -= meteor.damage;
				meteor.strength -= this.damage;  
				
			}else if (hitTestRectangle(this, meteor) && this.id != meteor.id && (this.state == "catched" || meteor.state == "catched")){
				var slope = Math.PI / 2 + calculateSlope(this, meteor);
	
				meteorCrashEffect(container.x + this.x, container.y + this.y, (180/Math.PI) * (Math.PI + slope), 1);
				meteorCrashEffect(container.x + meteor.x, container.y + meteor.y, (180/Math.PI) * (2 * Math.PI + slope), 1);
				this.x += this.speedX * Math.sin(slope);
				this.y -= this.speedY * Math.cos(slope);
				
				this.strength -= meteor.damage;
				meteor.strength -= this.damage;  
				
				pShip.x += pShip.speedX * Math.sin(slope);
				pShip.y -= pShip.speedY * Math.cos(slope);
	
				pShip.moveItems();					
			}
		}.bind(this));  
	}
}

class Enemy1 extends Enemy{

	move(){
		if(contain(this, containerBounds) == undefined){
			this.x += this.speedX * Math.sin(this.rotation);
			this.radars.forEach(function(radar){
				radar.x += this.speedX * Math.sin(this.rotation);
				if (radar.x >= this.x) {
					radar.x = this.x + 1.5 * xStep;
				} else {
					radar.x = this.x - 1.5 * xStep;
				}
			}.bind(this));		 
		}
		else{
			this.rotation = this.rotation + Math.PI;
			this.x += this.speedX * Math.sin(this.rotation);
			this.radars.forEach(function(radar){
				radar.x += this.speedX * Math.sin(this.rotation);
				if (radar.x >= this.x) {
					radar.x = this.x + 1.5 * xStep;
				} else {
					radar.x = this.x - 1.5 * xStep;
				}
			}.bind(this));		 
		}
	}
	
	radar(){
		this.radars.forEach(function(radar){
			if(hitTestRectangle(pShip, radar) && this.readyLauncher && !pShip.invisibilityStatus){
				if (this.x <= pShip.x) {
					this.rotation = Math.PI/2;
					this.eFire();
				} else {
					this.rotation = 3*(Math.PI/2);
					this.eFire();
				}
			}

			/*eShips.forEach(function(eShip){
				if(hitTestRectangle(eShip, radar) && this.id !== eShip.id){
					this.rotation += Math.PI;
					this.x += 2 * xStep * Math.sin(this.rotation);
				}
			}.bind(this, radar));*/		   
		}.bind(this));
		
	}
	
	hit(bullet) {
		super.hit(bullet);
		var tempRotation = bullet.rotation % (2*Math.PI);
		if (this.hitCount == 0) {
			this.prevRotation = this.rotation;
			this.prevVX = this.speedX;
			this.prevVY = this.speedY;
			this.speedX = 0;
			this.speedY = 0;
		}
		this.hitCount++;
		if (tempRotation < 0) {
			tempRotation += 2*Math.PI;
		}
		if (tempRotation > Math.PI/4 && tempRotation <= 3*(Math.PI/4)) {
			this.rotation = 3*(Math.PI/2);
		} else if (tempRotation > 3*(Math.PI/4) && tempRotation <= 5*(Math.PI/4)) {
			this.rotation = 0;
		} else if (tempRotation > 5*(Math.PI/4) && tempRotation <= 7*(Math.PI/4)) {
			this.rotation = Math.PI/2;
		} else {
			this.rotation = Math.PI;
		}
		this.eFire();
		setTimeout(function(){
			this.rotation = this.prevRotation;
			this.speedX = this.prevVX;
			this.speedY = this.prevVY;
			
			this.hitCount--;
			if (this.hitCount == 0) {
				this.prevRotation = null;
				this.prevVX = null;
				this.prevVY = null;
			}
		}.bind(this), 200);
	}
}

class Enemy2 extends Enemy{

	move(){
		if(contain(this, containerBounds) == undefined){
			this.y -= this.speedY * Math.cos(this.rotation);
			this.radars.forEach(function(radar){
				radar.y -= this.speedY * Math.cos(this.rotation);
				if (radar.y >= this.y) {
					radar.y = this.y + 1.5 * yStep;
				} else {
					radar.y = this.y - 1.5 * yStep;
				}
			}.bind(this));		 
		}
		else{
			this.rotation = this.rotation + Math.PI;
			this.y -= this.speedY * Math.cos(this.rotation);
			this.radars.forEach(function(radar){
				radar.y -= this.speedY * Math.cos(this.rotation);
				if (radar.y >= this.y) {
					radar.y = this.y + 1.5 * yStep;
				} else {
					radar.y = this.y - 1.5 * yStep;
				}
			}.bind(this));		 
		}
	}
	
	radar(){
		this.radars.forEach(function(radar){
			if(hitTestRectangle(pShip, radar) && this.readyLauncher && !pShip.invisibilityStatus){
				if (this.y <= pShip.y) {
					this.rotation = Math.PI;
					this.eFire();
				} else {
					this.rotation = 0;
					this.eFire();
				}
			}
			
			/*eShips.forEach(function(eShip){
				if(hitTestRectangle(eShip, radar) && this.id !== eShip.id){
					eShip.rotation += Math.PI;
					eShip.y -= yStep * 2 * Math.cos(this.rotation);
					console.log(this.id, eShip.id);
				}
			}.bind(this, radar));*/
				
		}.bind(this));
	}
	
	hit(bullet) {
		super.hit(bullet);
		var tempRotation = bullet.rotation % (2*Math.PI);
		if (this.hitCount == 0) {
			this.prevRotation = this.rotation;
			this.prevVX = this.speedX;
			this.prevVY = this.speedY;
			this.speedX = 0;
			this.speedY = 0;
		}
		this.hitCount++;
		if (tempRotation < 0) {
			tempRotation += 2*Math.PI;
		}
		this.factor = 0;
		if (tempRotation > Math.PI/4 && tempRotation <= 3*(Math.PI/4)) {
			this.rotation = 3*(Math.PI/2);
		} else if (tempRotation > 3*(Math.PI/4) && tempRotation <= 5*(Math.PI/4)) {
			this.rotation = 0;
		} else if (tempRotation > 5*(Math.PI/4) && tempRotation <= 7*(Math.PI/4)) {
			this.rotation = Math.PI/2;
		} else {
			this.rotation = Math.PI;
		}
		this.eFire();
		setTimeout(function(){
			this.rotation = this.prevRotation;
			this.speedX = this.prevVX;
			this.speedY = this.prevVY;
			
			this.hitCount--;
			if (this.hitCount == 0) {
				this.prevRotation = null;
				this.prevVX = null;
				this.prevVY = null;
			}
		}.bind(this), 200);
	}
}

class Enemy3 extends Enemy{
	constructor(texture, energy = 50, factor = 1, itemList = [], 
					bulletTextures = {}, deathItemsTextures = [], effectTextures={}, radars = []){
		super(texture,energy,factor,itemList,bulletTextures,deathItemsTextures,effectTextures,radars);
		this.status = "Normal";
		this.readyPhaser = true;
	}
	
	move(){
		if(contain(this, containerBounds) == undefined) {
			if (Math.random() < 0.01) {
				this.rotation = this.rotation + Math.random() > 0.5 ? (Math.PI/2) : (Math.PI/-2);
				this.radars[0].rotation = this.rotation;
			} else {
				this.y -= this.speedY * Math.cos(this.rotation);
				this.x += this.speedX * Math.sin(this.rotation);
			}
		}
		else {
			this.y += this.speedY * Math.cos(this.rotation);
			this.x -= this.speedX * Math.sin(this.rotation);
			this.rotation += Math.random() > 0.5 ? (Math.PI/2) : (Math.PI/-2);
			this.radars[0].rotation = this.rotation;
		}
		this.radars[0].x = this.x + xStep * 0.3 * Math.sin(this.rotation);
		this.radars[0].y = this.y - yStep * 0.3 * Math.cos(this.rotation);
	}
	
	phase(time = 3000, recharge = 1000){
		if (this.readyPhaser) {
			this.readyPhaser = false;
			this.status = "Phased";
			this.alpha = 0.5;
			//this.blendMode = PIXI.BLEND_MODES.SCREEN;
			setTimeout(function() {
				this.status = "Normal";
				//this.blendMode = PIXI.BLEND_MODES.NORMAL;
				this.alpha = 1;
			}.bind(this),time);
			setTimeout(function() {
				this.readyPhaser = true;
			}.bind(this),time+recharge);
		}
	}
	
	radar() {
		if (hitTestRectangle(pShip, this.radars[0]) && this.readyLauncher && !pShip.invisibilityStatus) {
			var tempRotation = this.rotation;
			this.rotation = Math.PI/2 + /*tempRotation +*/ calculateSlope(pShip, this);
			this.eFire();
			//this.factor = 1;
			this.rotation = tempRotation;
		}
		
		if (this.status !== "Phased") {
			meteors.some(function(meteor){
				if(hitTestRectangle(meteor, this.radars[0])){
					this.phase();
				}
			}.bind(this));
			
			pBullets.some(function(bullet){
				if(hitTestRectangle(bullet, this.radars[0])){
					this.phase();
				}
			}.bind(this));
		}
	}
	
	hit(bullet) {
		if (this.status !== "Phased") {
			super.hit(bullet);
			console.log("Hit!");
			this.phase();
		} else {
			return true;
		}
	}
	
	collide(meteor) {
		if (this.status !== "Phased") {
			this.x -= this.speedX * Math.sin(this.rotation);
			this.y += this.speedY * Math.cos(this.rotation);
			this.energy -= meteor.damage;
			meteor.strengh -= meteor.damage;
			this.phase();
		}
	}
	
	controlStatus(){
		this.intervalId = setInterval(function(){
			this.readyLauncher = true;
		}.bind(this),1000);
	}
}

class Enemy4 extends Enemy{
	constructor(texture, energy = 50, factor = 1, itemList = [], bulletTextures = {}, deathItemsTextures = [], effectTextures={}, radars = []){
		super(texture,energy,factor,itemList,bulletTextures,deathItemsTextures,effectTextures,radars);
		this.move = Enemy4.defaultMove.bind(this);
		this.collide = Enemy4.defaultCollide.bind(this);
		this.hit = Enemy4.defaultHit.bind(this);
		this.radar = Enemy4.defaultRadar.bind(this);
		this.dirChange = true;
		this.dirChangeTimeout = null;
	}
	
	static defaultMove() {
		if(contain(this, containerBounds) == undefined){
			if (this.rotation == Math.PI || this.rotation == 0) {
				this.y -= this.speedY * Math.cos(this.rotation);
				this.radars.forEach(function(radar){
					radar.y -= this.speedY * Math.cos(this.rotation);
					if (radar.y >= this.y) {
						radar.y = this.y + 1.5 * yStep;
					} else {
						radar.y = this.y - 1.5 * yStep;
					}
				}.bind(this));
			} else {
				this.x += this.speedX * Math.sin(this.rotation);
				this.radars.forEach(function(radar){
					radar.x += this.speedX * Math.sin(this.rotation);
					if (radar.x >= this.x) {
						radar.x = this.x + 1.5 * xStep;
					} else {
						radar.x = this.x - 1.5 * xStep;
					}
				}.bind(this));
			}
		}
		else{
			this.rotation = (this.rotation + Math.PI) % (2*Math.PI);
			if (this.rotation == Math.PI || this.rotation == 0) {
				this.y -= this.speedY * Math.cos(this.rotation);
				this.radars.forEach(function(radar){
					radar.y -= this.speedY * Math.cos(this.rotation);
					if (radar.y >= this.y) {
						radar.y = this.y + 1.5 * yStep;
					} else {
						radar.y = this.y - 1.5 * yStep;
					}
				}.bind(this));	   
			} else {
				this.x += this.speedX * Math.sin(this.rotation);
				this.radars.forEach(function(radar){
					radar.x += this.speedX * Math.sin(this.rotation);
					if (radar.x >= this.x) {
						radar.x = this.x + 1.5 * xStep;
					} else {
						radar.x = this.x - 1.5 * xStep;
					}
				}.bind(this));
			}		 
		}
	}
	
	static lockedMove() {
		var diff = {
			x : this.x - pShip.x,
			y : this.y - pShip.y
		};
		if (Math.abs(diff.x) < xStep && Math.abs(diff.y) < yStep) {
			this.energy = 0;
			pShip.energy = 0;
			return;
		}
		if (this.dirChange) {
			if (Math.abs(diff.x) >= Math.abs(diff.y)) {
				if (diff.x >= 0) {
					this.rotation = 3*(Math.PI/2);
				} else {
					this.rotation = Math.PI/2;
				}
			} else {
				if (diff.y >= 0) {
					this.rotation = 0;
				} else {
					this.rotation = Math.PI;
				}
			}
			this.dirChange = false;
			this.dirChangeTimeout = setTimeout(function(){ this.dirChange = true; }.bind(this),500);
		}
		this.x += this.speedX*Math.sin(this.rotation);
		this.y -= this.speedY*Math.cos(this.rotation);
	}
	
	static defaultCollide(meteor) {
		var slope = Math.PI / 2 + calculateSlope(this, meteor);
		
		if(meteor.state == "free"){
			particalEffect(container.x + this.x, container.y + this.y, (180/Math.PI) * (Math.PI + slope));
			meteorCrashEffect(container.x + meteor.x, container.y + meteor.y, (180/Math.PI) * (Math.PI + slope), 1);
			meteor.move = Meteor.pushedMoveMaker.bind(meteor)(xStep/10,Math.PI/2+slope,30);
		
			this.x += this.speedX * Math.sin(slope);
			this.y -= this.speedY * Math.cos(slope);
			this.radars.forEach(function(radar){
				radar.x += this.speedX * Math.sin(slope);
				radar.y -= this.speedY * Math.cos(slope);
			}.bind(this));
		
			meteor.strength -= meteor.damage;
		}
		
		else if(meteor.state == "catched"){
			particalEffect(container.x + this.x, container.y + this.y, (180/Math.PI) * (Math.PI + slope));
			
			this.x += this.speedX * Math.sin(slope);
			this.y -= this.speedY * Math.cos(slope);
			this.radars.forEach(function(radar){
				radar.x += this.speedX * Math.sin(slope);
				radar.y -= this.speedY * Math.cos(slope);
			}.bind(this));
			
			pShip.uncatch();
			meteor.strength = 0;
		}
	}
	
	static lockedCollide(meteor) {
		var slope = Math.PI / 2 + calculateSlope(this, meteor);
		
		if(meteor.state == "free"){
			particalEffect(container.x + this.x, container.y + this.y, (180/Math.PI) * (Math.PI + slope));
			meteorCrashEffect(container.x + meteor.x, container.y + meteor.y, (180/Math.PI) * (Math.PI + slope), 1);
			//meteor.move = Meteor.pushedMoveMaker.bind(meteor)(xStep/10,Math.PI/2+slope,30);
		
			this.x += this.speedX * Math.sin(slope);
			this.y -= this.speedY * Math.cos(slope);
			this.radars.forEach(function(radar){
				radar.x += this.speedX * Math.sin(slope);
				radar.y -= this.speedY * Math.cos(slope);
			}.bind(this));
			
			this.energy = 0;
			meteor.strength = 0;
		}
		
		else if(meteor.state == "catched"){
			particalEffect(container.x + this.x, container.y + this.y, (180/Math.PI) * (Math.PI + slope));
			
			this.x += this.speedX * Math.sin(slope);
			this.y -= this.speedY * Math.cos(slope);
			this.radars.forEach(function(radar){
				radar.x += this.speedX * Math.sin(slope);
				radar.y -= this.speedY * Math.cos(slope);
			}.bind(this));
			
			pShip.uncatch();
			this.energy = 0;
			meteor.strength = 0;
		}
	}
	
	static defaultHit(bullet) {
		this.move = Enemy4.lockedMove.bind(this);
		this.collide = Enemy4.lockedCollide.bind(this);
		this.hit = function(){};
		this.radar = function(){};
		this.dealTeamCrash = Enemy4.lockedDealTeamCrash.bind(this);
		
		this.radars.filter(function(radar){
			container.removeChild(radar);
			return false;
		});
	}
	
	static defaultRadar() {
		var flag = false;
		this.radars.forEach(function(radar){
			if(hitTestRectangle(pShip, radar) && this.readyLauncher && !pShip.invisibilityStatus){
				this.move = Enemy4.lockedMove.bind(this);
				this.collide = Enemy4.lockedCollide.bind(this);
				this.hit = function(){};
				this.radar = function(){};
				this.dealTeamCrash = Enemy4.lockedDealTeamCrash.bind(this);
				flag = true;
			}
		}.bind(this));
		if (flag){
			this.radars.filter(function(radar){
				container.removeChild(radar);
				return false;
			});
		}
	}
	
	static lockedDealTeamCrash() {
		eShips.forEach(function(eShip){
			if(calculateDistance(eShip, this) < 1.5 * xStep && eShip.id != this.id){
				this.energy = 0;
				eShip.energy = 0;
			}
		}.bind(this));
	}
}

function calculateRotationParams() {
	rotationParams.o = {
		x : (rotationParams.f0.x + rotationParams.f1.x) / 2,
		y : (rotationParams.f0.y + rotationParams.f1.y) / 2
	};
	
	rotationParams.e = Math.atan2(rotationParams.f0.y - rotationParams.f1.y, rotationParams.f0.x - rotationParams.f1.x);
	
	rotationParams.sin_e = Math.sin(rotationParams.e);
	rotationParams.cos_e = Math.cos(rotationParams.e);
	
	rotationParams.f0_t_x = (rotationParams.f0.x - rotationParams.o.x)*rotationParams.cos_e + (rotationParams.f0.y - rotationParams.o.y)*rotationParams.sin_e;
	rotationParams.f1_t_x = (rotationParams.f1.x - rotationParams.o.x)*rotationParams.cos_e + (rotationParams.f1.y - rotationParams.o.y)*rotationParams.sin_e;
}

function game(){
	calculateRotationParams();
	
	proton = new Proton();
	
	var renderer = new Proton.PixiRenderer(app.stage);
	proton.addRenderer(renderer);
	
	bgTexture = new PIXI.Texture.from(path + "starfield.png");
	shipTexture = new PIXI.Texture.from(path + "spaceShips_001.png");
	playerEnergyBulletTexture = new PIXI.Texture.fromImage(path + "spaceMissiles_010.png");
	enemyEnergyBulletTexture = new PIXI.Texture.fromImage(path + "spaceMissiles_011.png");
	meteorTexture = new PIXI.Texture.fromImage(path + "spaceMeteors_004.png");
	shipTexture1 = new PIXI.Texture.fromImage(path + "spaceShips_002b.png");
	shipTexture2 = new PIXI.Texture.fromImage(path + "spaceShips_003b.png");
	shipTexture3 = new PIXI.Texture.fromImage(path + "spaceShips_004b.png");
	
	itemTexture0 = new PIXI.Texture.fromImage(path + "star_bronze.png");
	
	warpTexture = new PIXI.Texture.fromImage(path + "spaceBuilding_007.png");
	
	breakerTexture = new PIXI.Texture.fromImage(path + "bolt_bronze.png");
	catcherTexture = new PIXI.Texture.fromImage(path + "things_bronze.png");
	
	breakEffect = new PIXI.Texture.fromImage(path + "spaceEffects_009.png");
	breakEffect1 = new PIXI.Texture.fromImage(path + "spaceEffects_011.png");
	breakEffect2 = new PIXI.Texture.fromImage(path + "spaceEffects_012.png");
	breakEffect3 = new PIXI.Texture.fromImage(path + "spaceEffects_013.png");
	breakEffect4 = new PIXI.Texture.fromImage(path + "spaceEffects_014.png");
	
	
	breakEffects = [];
	
	breakEffects.push(breakEffect);
	breakEffects.push(breakEffect1);
	breakEffects.push(breakEffect2);
	breakEffects.push(breakEffect3);
	breakEffects.push(breakEffect4);
	
	shipBreakEffect = new PIXI.Texture.fromImage(path + "spaceEffects_018.png");
	
	enemyOneRadar = new PIXI.Texture.fromImage(path + "radar.png");
	
	pDeathItem = new PIXI.Texture.fromImage(path + "spaceParts_001.png");
	pDeathItem1 = new PIXI.Texture.fromImage(path + "spaceParts_003.png");
	pDeathItem2 = new PIXI.Texture.fromImage(path + "spaceParts_033.png");
	pDeathItem3 = new PIXI.Texture.fromImage(path + "spaceParts_042.png");
	
	pDeathItems = [];
	
	pDeathItems.push(pDeathItem);
	pDeathItems.push(pDeathItem1);
	pDeathItems.push(pDeathItem2);
	pDeathItems.push(pDeathItem3);
	
	eDeathItem = new PIXI.Texture.fromImage(path + "spaceParts_002.png");
	eDeathItem1 = new PIXI.Texture.fromImage(path + "spaceParts_004.png");
	eDeathItem2 = new PIXI.Texture.fromImage(path + "spaceParts_040.png");
	eDeathItem3 = new PIXI.Texture.fromImage(path + "spaceParts_045.png");
	
	eDeathItems = [];
	
	eDeathItems.push(eDeathItem);
	eDeathItems.push(eDeathItem1);
	eDeathItems.push(eDeathItem2);
	eDeathItems.push(eDeathItem3);
	
	transportMeteorItem = new PIXI.Texture.fromImage(path + "spaceEffects_003.png");
	invisibilityItem = new PIXI.Texture.fromImage(path + "shield_bronze.png");
	station1Texture = new PIXI.Texture.fromImage(path + "spaceStation_020.png")
	station1Radar = new PIXI.Texture.fromImage(path + "station1_radar.png");
	
	bg = new PIXI.Sprite(bgTexture);
	bg.x = 0;
	bg.y = 0;
	bg.width = x;
	bg.height = 0.85 * y;
	bg.interactive = true;
	bg.buttonMode = true;
  	bg
		.on('mousedown', touchStart)
		.on('mouseup', touchEnd)
		.on('mousemove', touchMove)
		.on('touchstart', touchStart)
		.on('touchmove', touchMove)
		.on('touchend', touchEnd); 
	
	app.stage.addChild(bg);
	
	container = new PIXI.Container();
	app.stage.addChild(container);
	
	loadLevel("level" + level);
	
	energyCounter = new PIXI.Container();
	energyCounter.position.set(xStep / 2, xStep / 2 );
	energyCounter.pivot.x =(xStep / 4);
	energyCounter.pivot.y =(xStep / 4);
	app.stage.addChild(energyCounter);
	
	var graphic = new PIXI.Graphics();
	graphic.beginFill(0x343b3d, 0.5);
	graphic.lineStyle(Math.ceil(yStep / 40), 0xeeeeee, 0.5);
	graphic.drawRoundedRect(0, 0, 2 * xStep, xStep / 2, 10);
	graphic.endFill();
	energyCounter.addChild(graphic);
	
	energyStep = xStep / 50;
	
	var graphic1 = new PIXI.Graphics();
	graphic1.beginFill(0xac3939, 0.5);
	//energyCounter.lineStyle(Math.ceil(yStep / 40), 0xeeeeee, 0.5);
	graphic1.drawRoundedRect(0, 0, xStep, xStep / 2, 10);
	graphic1.endFill();
	energyCounter.addChild(graphic1);
	
	energyCounter.counter = graphic1;
	
	var breakerButton = new PIXI.Sprite(breakerTexture);
	breakerButton.x = 9 * xStep + 0.25 * xStep;
	breakerButton.y = 0 * yStep + 0.5 * xStep;
	breakerButton.width = xStep / 2;
	breakerButton.height = xStep / 2;
	breakerButton.anchor.set(0.5);
	breakerButton.alpha = 0.3;
	breakerButton.buttonMode = true;
	breakerButton.interactive = true;
	breakerButton.rotation = Math.PI / 2;
	breakerButton
			.on('mousedown', breakMeteor)
			.on('mouseup', releaseMeteor)
			.on('touchstart', breakMeteor)
			.on('touchend', releaseMeteor);
			
	app.stage.addChild(breakerButton);
			
	var catcherButton = new PIXI.Sprite(catcherTexture);
	catcherButton.x = 8 * xStep + 0.25 * xStep;
	catcherButton.y = 0 * yStep + 0.5 * xStep;
	catcherButton.width = xStep / 2;
	catcherButton.height = xStep / 2;
	catcherButton.anchor.set(0.5);
	catcherButton.alpha = 0.3;
	catcherButton.count = 0;
	catcherButton.buttonMode = true;
	catcherButton.interactive = true;
	catcherButton.rotation = Math.PI / 2;
	catcherButton
			.on('mousedown', catchMeteor)
			.on('mouseup', leaveMeteor)
			.on('touchstart', catchMeteor)
			.on('touchend', leaveMeteor);
			   
	app.stage.addChild(catcherButton);
	
	var invisibilityButton = new PIXI.Sprite(invisibilityItem); 
	invisibilityButton.x = 7 * xStep + 0.25 * xStep;
	invisibilityButton.y = 0 * yStep + 0.5 * xStep;
	invisibilityButton.width = xStep / 2;
	invisibilityButton.height = xStep / 2;
	invisibilityButton.anchor.set(0.5);
	invisibilityButton.alpha = 0.3;
	invisibilityButton.count = 0;
	invisibilityButton.buttonMode = true;
	invisibilityButton.interactive = true;
	invisibilityButton.rotation = Math.PI / 2;
	invisibilityButton
			.on('mousedown', onInvisibility)
			.on('mouseup', offInvisibility)
			.on('touchstart', onInvisibility)
			.on('touchend', offInvisibility);
			   
	app.stage.addChild(invisibilityButton);	
	
	pShip.controlStatus();
	for (var i = 0; i < stations.length; i++) {
		stations[i].controlStatus();
	}
	
	eShips.forEach(function(enemy){
		enemy.controlStatus();
	});
	
	app.ticker.add(function(){
		
		if(pShip.alive){
			energyCounter.counter.width = pShip.energy * energyStep;
			pShip.move(pShip.dir);
			pShip.moveItems(pShip.dir);
		}
		meteors = meteors.filter(function(meteor){
			var ret = true;
			meteor.resolveSelfCrash();
			
			if(meteor.strength <= 0){
				meteor.death();
				ret = false;
			}
			
			if(meteor.state == "free"){
				meteor.move();
				meteor.rotation = (meteor.rotation + 13 * meteor.s) % (Math.PI*2);
			}
			
			if(hitTestRectangle(meteor, pShip)){
				pShip.collide(meteor);
				ret = true;				  
			}
			if(pShip.itemList["catchItem"] && (!pShip.itemList["catchedMeteor"] || pShip.itemList["catchedMeteor"].strength === 0) && hitTestRectangle(meteor, pShip.itemList["catchItem"])){
			
				pShip.catchMeteor(meteor);
				ret = true;
			}
			eShips.forEach(function(eShip){
				if(hitTestRectangle(meteor, eShip)){
					eShip.collide(meteor);
					ret = true;	   
				}				
			});	
			
			return ret;
		});
		
		items = items.filter(function(item){
			var ret = true;
			
			if (hitTestRectangle(item, pShip)){
				item.collect();
				ret = false;
			}
			
			return ret;
		});
		
		warps.forEach(function(warp){
			if (hitTestRectangle(warp, pShip)){
				warp.warp();
			}
		});
		
		pBullets = pBullets.filter(function(bullet){
		
			var ret = true;
			bullet.move();
			
			if(contain(bullet, containerBounds) !== undefined || calculateDistance(bullet, bullet.initialPos) > bullet.range){	   
				container.removeChild(bullet);
				ret = false;
			}
			
			eShips.forEach(function(eShip){
				if(hitTestRectangle(eShip, bullet)){
					ret = eShip.hit(bullet);
					if (ret == undefined) {
						ret = false;
					}
					if (ret === false) {
						container.removeChild(bullet);
					}
				}
			});
			
			stations.forEach(function(station){
			    if(hitTestRectangle(station, bullet)){
			        ret = station.hit(bullet);
			        if(ret == undefined){
			            ret = false;
			        }
			        if(ret === false){
			            container.removeChild(bullet);
			        }
			    }
			});
			
			meteors.forEach(function(meteor){
				if(hitTestRectangle(meteor, bullet)){
					container.removeChild(bullet);
					ret = false;
				}
			});
			
			return ret;
		});
		
		eBullets = eBullets.filter(function(bullet){
		
			var ret = true;
			bullet.move();
			
			if(contain(bullet, containerBounds) !== undefined || calculateDistance(bullet, bullet.initialPos) > bullet.range){	   
				container.removeChild(bullet);
				ret =  false;
			}
			
			if(hitTestRectangle(pShip, bullet)){
				pShip.energy -= bullet.effect;
				container.removeChild(bullet);
				ret = false;
			}

			meteors.forEach(function(meteor){
				if(hitTestRectangle(meteor, bullet)){
					container.removeChild(bullet);
					ret = false;
				}
			});
			
			eShips.forEach(function(eShip){
				if(hitTestRectangle(eShip, bullet)){
					bullet.alpha = 0.1;
					//ret = true;
					console.log("ok");
				} else {
					bullet.alpha = 1.0;
					//ret = true;				
				}
			});
			
			stations.forEach(function(station){
				if(hitTestRectangle(station, bullet)){
					bullet.alpha = 0;
					//ret = true;
				} else {
					bullet.alpha = 1.0;
					//ret = true;				
				}
			});
			
			return ret;
		});
		
		eShips = eShips.filter(function(eShip){
			eShip.move();
			eShip.radar();
			eShip.dealTeamCrash();
			
			if(eShip.energy <= 0){
				container.removeChild(eShip);
				eShip.death();
				return false;
			}
			
			return true;
		});
		
		contain(pShip, containerBounds);
		
		if(pShip.energy <= 0 && pShip.alive){
			container.removeChild(pShip);
			pShip.death();
			pShip.alive = false;
			energyCounter.counter.width = 0;
		}
		
		proton.update();
		
	});
}

function touchStart(event){
	
	this.data = event.data;
	this.flag = true;
	
	this.startX = this.data.getLocalPosition(this.parent).x;
	this.startY = this.data.getLocalPosition(this.parent).y;
	
	if(this.startY < adLoc / 2){
		pShip.eFire();
	}
}
		
function touchEnd(){
	
	this.flag = false;
	this.data = null;
	pShip.dir = 0;
}
		
function touchMove(event){
	
	if(event.target !== null && this.flag && this.startY >= adLoc / 2 && this.startY < adLoc){ 
																	//contain(pShip, windowBounds) == undefined){
		this.curX = this.data.getLocalPosition(this.parent).x;
		this.curY = this.data.getLocalPosition(this.parent).y;
		pShip.beforeRotation = pShip.rotation;
		if (this.curX - this.startX > 0 && Math.abs(this.curX-this.startX)>Math.abs(this.curY-this.startY)) {
			pShip.dir = 3;
		}
		if(this.curX - this.startX < 0 && Math.abs(this.curX-this.startX)>Math.abs(this.curY-this.startY)){
			pShip.dir = 4;				
		}
		if(this.curY - this.startY > 0 && Math.abs(this.curX-this.startX)<Math.abs(this.curY-this.startY)){
			pShip.dir = 1;						
		}
		if(this.curY - this.startY < 0 && Math.abs(this.curX-this.startX)<Math.abs(this.curY-this.startY)){
			pShip.dir = 2;				
		}
	}
}

function breakMeteor(event){
	
	this.data = event.data;
	this.flag = true;
	
	bg.interactive = false;
	bg.buttonMode = false;
	
	
	if(pShip.meteorBreakerStatus == 0 && pShip.invisibilityStatus == 0){
	
		pShip.meteorBreakerStatus = 1;
		var flagX = true;
		breakerLoc = pShip.getBreakerLoc();

	
		var shipBreakEffect = new PIXI.Sprite(pShip.effectTextures["breakEffect"]);
		shipBreakEffect.x = breakerLoc.x;
		shipBreakEffect.y = breakerLoc.y;
		shipBreakEffect.width = xStep;
		shipBreakEffect.height = xStep;
		shipBreakEffect.anchor.set(0.5);
		shipBreakEffect.rotation = pShip.rotation;
		shipBreakEffect.distance = 0;
		container.addChild(shipBreakEffect);
		pShip.itemList["meteorBreakItem"] = shipBreakEffect;
	
		meteors = meteors.filter(function(meteor){
			if(hitTestRectangle(shipBreakEffect, meteor)){
				flagX = false;
				setTimeout(function(){
			
					container.removeChild(meteor);
					meteor.breakIt();
					pShip.energy += 10 * pShip.factor;
					pShip.itemList["meteorBreakItem"] = null;
					container.removeChild(shipBreakEffect);
				   
					if(pShip.itemList["catchedMeteor"]){
						pShip.itemList["catchedMeteor"] = null;
					}
				
					bg.interactive = true;
					bg.buttonMode = true;
				
				}, 200);
				pShip.meteorBreakerStatus = 0;
				return false;
			
			}else{
				
				return true;	

			}
		});
		
		if(flagX){
			setTimeout(function(){
				pShip.itemList["meteorBreakItem"] = null;
				container.removeChild(shipBreakEffect);
				bg.interactive = true;
				bg.buttonMode = true;
				pShip.meteorBreakerStatus = 0;	
			}, 1000);
		}
	
	}
	
	else if(pShip.meteorBreakerStatus == 0 && pShip.invisibilityStatus == 1 && pShip.itemList["breakRegulator"]){
		pShip.meteorBreakerStatus = 1;
		var flagX = true;
		breakerLoc = pShip.getBreakerLoc();

	
		var shipBreakEffect = new PIXI.Sprite(pShip.effectTextures["breakEffect"]);
		shipBreakEffect.x = breakerLoc.x;
		shipBreakEffect.y = breakerLoc.y;
		shipBreakEffect.width = xStep;
		shipBreakEffect.height = xStep;
		shipBreakEffect.alpha = 0.75;
		shipBreakEffect.anchor.set(0.5);
		shipBreakEffect.rotation = pShip.rotation;
		shipBreakEffect.distance = 0;
		container.addChild(shipBreakEffect);
		pShip.itemList["meteorBreakItem"] = shipBreakEffect;
	
		meteors = meteors.filter(function(meteor){
			if(hitTestRectangle(shipBreakEffect, meteor)){
				flagX = false;
				setTimeout(function(){
			
					container.removeChild(meteor);
					meteor.breakIt();
					pShip.energy += 10 * pShip.factor;
					container.removeChild(shipBreakEffect);
					pShip.itemList["meteorBreakItem"] = null;
					
					if(pShip.itemList["catchedMeteor"]){
						pShip.itemList["catchedMeteor"] = null;
					}
				
					bg.interactive = true;
					bg.buttonMode = true;
				
				}, 200);
				
				pShip.meteorBreakerStatus = 0;
				return false;
			
			}else{
				
				return true;	

			}
		});
		
		if(flagX){
			setTimeout(function(){
			
				container.removeChild(shipBreakEffect);
				pShip.itemList["meteorBreakItem"] = null;
				bg.interactive = true;
				bg.buttonMode = true;
				pShip.meteorBreakerStatus = 0;	
			}, 1000);
		}	
	}
	else if(pShip.meteorBreakerStatus == 0 && pShip.invisibilityStatus == 1 && !pShip.itemList["breakRegulator"]){
		pShip.invisibilityStatus = 0;
		pShip.alpha = 1.0;
		pShip.meteorBreakerStatus = 1;
		var flagX = true;
		breakerLoc = pShip.getBreakerLoc();

	
		var shipBreakEffect = new PIXI.Sprite(pShip.effectTextures["breakEffect"]);
		shipBreakEffect.x = breakerLoc.x;
		shipBreakEffect.y = breakerLoc.y;
		shipBreakEffect.alpha = 1.0;
		shipBreakEffect.width = xStep;
		shipBreakEffect.height = xStep;
		shipBreakEffect.anchor.set(0.5);
		shipBreakEffect.rotation = pShip.rotation;
		shipBreakEffect.distance = 0;
		container.addChild(shipBreakEffect);
		pShip.itemList["meteorBreakItem"] = shipBreakEffect;
	
		meteors = meteors.filter(function(meteor){
			if(hitTestRectangle(shipBreakEffect, meteor)){
				flagX = false;
				setTimeout(function(){
			
					container.removeChild(meteor);
					meteor.breakIt();
					pShip.energy += 10 * pShip.factor;
					container.removeChild(shipBreakEffect);
					pShip.itemList["meteorBreakItem"] = null;
					
					if(pShip.itemList["catchedMeteor"]){
						pShip.itemList["catchedMeteor"] = null;
					}
				
					bg.interactive = true;
					bg.buttonMode = true;
				
				}, 200);
				
				pShip.meteorBreakerStatus = 0;
				return false;
			
			}else{
				
				return true;	

			}
		});
		
		if(flagX){
			setTimeout(function(){
			
				container.removeChild(shipBreakEffect);
				pShip.itemList["meteorBreakItem"] = null;
				bg.interactive = true;
				bg.buttonMode = true;
				pShip.meteorBreakerStatus = 0;	
			}, 1000);
		}		
	}
}

function releaseMeteor(){

	this.data = null;
	this.flag = false;

}

function catchMeteor(event){

	this.data = event.data;
	this.flag = true;
	
	//console.log(this.count);
	//breakerLoc = pShip.getBreakerLoc();
	
	if(pShip.meteorCatcherStatus == 0 && pShip.invisibilityStatus == 0){
		breakerLoc = pShip.getBreakerLoc();
	
		pShip.meteorCatcherStatus = 1;
		var catchItem = new PIXI.Sprite(pShip.effectTextures["transportMeteorEffect"]);
		catchItem.x = breakerLoc.x;
		catchItem.y = breakerLoc.y;
		catchItem.width = xStep;
		catchItem.height = xStep;
		catchItem.anchor.set(0.5);
		catchItem.rotation = pShip.rotation;
		pShip.itemList["catchItem"] = catchItem;
		pShip.itemList["catchItem"].distance = 0;
		pShip.itemList["catchedMeteor"] = null;
		container.addChild(catchItem);

	}
	else if(pShip.meteorCatcherStatus == 1 && pShip.invisibilityStatus == 0){
		pShip.meteorCatcherStatus = 0;
		container.removeChild(pShip.itemList["catchItem"]);
		pShip.itemList["catchItem"] = null;
		
		if(pShip.itemList["catchedMeteor"] && pShip.itemList["catchedMeteor"].state != "death"){
			pShip.itemList["catchedMeteor"].state = "free";
			pShip.itemList["catchedMeteor"].calculateRotParams();
			pShip.uncatch();
	
		}
	}
	else if(pShip.meteorCatcherStatus == 0 && pShip.invisibilityStatus == 1 && !pShip.itemList["magnetoRegulator"]){
	
	    pShip.invisibilityStatus = 0;
		pShip.alpha = 1.0;
		breakerLoc = pShip.getBreakerLoc();
	
		pShip.meteorCatcherStatus = 1;
		var catchItem = new PIXI.Sprite(pShip.effectTextures["transportMeteorEffect"]);
		catchItem.x = breakerLoc.x;
		catchItem.y = breakerLoc.y;
		catchItem.width = xStep;
		catchItem.height = xStep;
		catchItem.anchor.set(0.5);
		catchItem.rotation = pShip.rotation;
		pShip.itemList["catchItem"] = catchItem;
		pShip.itemList["catchItem"].distance = 0;
		pShip.itemList["catchedMeteor"] = null;
		container.addChild(catchItem);
	}
	
	else if(pShip.meteorCatcherStatus == 1 && pShip.invisibilityStatus == 1 && !pShip.itemList["magnetoRegulator"]){
		pShip.meteorCatcherStatus = 0;
		container.removeChild(pShip.itemList["catchItem"]);
		pShip.itemList["catchItem"] = null;
		
		if(pShip.itemList["catchedMeteor"] && pShip.itemList["catchedMeteor"].state != "death"){
			pShip.itemList["catchedMeteor"].state = "free";
			pShip.itemList["catchedMeteor"].calculateRotParams();
			pShip.uncatch();
	
		}	
	}
	
	else if(pShip.meteorCatcherStatus == 0 && pShip.invisibilityStatus == 1 && pShip.itemList["magnetoRegulator"]){
		breakerLoc = pShip.getBreakerLoc();
	
		pShip.meteorCatcherStatus = 1;
		var catchItem = new PIXI.Sprite(pShip.effectTextures["transportMeteorEffect"]);
		catchItem.x = breakerLoc.x;
		catchItem.y = breakerLoc.y;
		catchItem.alpha = 0.5;
		catchItem.width = xStep;
		catchItem.height = xStep;
		catchItem.anchor.set(0.5);
		catchItem.rotation = pShip.rotation;
		pShip.itemList["catchItem"] = catchItem;
		pShip.itemList["catchItem"].distance = 0;
		pShip.itemList["catchedMeteor"] = null;
		container.addChild(catchItem);	
	}
	
	else if (pShip.meteorCatcherStatus == 1 && pShip.invisibilityStatus == 1 && pShip.itemList["magnetoRegulator"]){
		pShip.meteorCatcherStatus = 0;
		container.removeChild(pShip.itemList["catchItem"]);
		pShip.itemList["catchItem"] = null;
		
		if(pShip.itemList["catchedMeteor"] && pShip.itemList["catchedMeteor"].state != "death"){
			pShip.itemList["catchedMeteor"].state = "free";
			pShip.itemList["catchedMeteor"].calculateRotParams();
			pShip.uncatch();
	
		}	
	}
	
}

function leaveMeteor(){

	this.data = null;
	this.flag = false;

}

function onInvisibility(event){

	this.data = event.data;
	this.flag = true;
	
	if(pShip.invisibilityStatus == 0){
	
		pShip.invisibilityStatus = 1;
		if(pShip.meteorCatcherStatus == 1 && !pShip.itemList["magnetoRegulator"]){
			pShip.meteorCatcherStatus = 0;
			container.removeChild(pShip.itemList["catchItem"]);
			pShip.itemList["catchItem"] = null;
		
			if(pShip.itemList["catchedMeteor"] && pShip.itemList["catchedMeteor"].state != "death"){
				pShip.itemList["catchedMeteor"].state = "free";
				pShip.itemList["catchedMeteor"].calculateRotParams();
				pShip.uncatch();
	
			}	
		}
		
		if(pShip.meteorBreakerStatus == 1 && !pShip.itemList["breakerRegulator"]){
		    container.removeChild(pShip.itemList["meteorBreakItem"]);
			pShip.itemList["meteorBreakItem"] = null;
			bg.interactive = true;
			bg.buttonMode = true;
			pShip.meteorBreakerStatus = 0;			
		}   
	
		pShip.alpha = 0.5;
	}else{
		pShip.invisibilityStatus = 0;
		pShip.alpha = 1.0;
	}
}

function offInvisibility(){
	this.data = null;
	this.flag = false;
}

function contain(sprite, container){
	
	var collision = undefined;

  	if (sprite.x - sprite.width / 2 < container.x) {
		sprite.x = container.x + sprite.width;
		collision = "left";
  	}

  	if (sprite.y - sprite.height / 2  < container.y) {
		sprite.y = container.y + sprite.height;
		collision = "top";
  	}

  	if (sprite.x + sprite.width / 2 > container.width + container.x) {
		sprite.x = (container.width + container.x) - sprite.width;
		collision = "right";
  	}

  	if (sprite.y + sprite.height / 2 > container.height + container.y) {
		sprite.y = (container.height + container.y) - sprite.height;
		collision = "bottom";
  	}

  	return collision;
}

function contain1(sprite, container){
	
	var collision = undefined;

  	if (sprite.x <= container.x) {
		collision = "left";
  	}

  	if (sprite.y <= container.y) {
		collision = "top";
  	}

  	if (sprite.x >= container.width) {
		collision = "right";
  	}

  	if (sprite.y >= container.height) {
		collision = "bottom";
  	}

  	return collision;
}

function hitTestRectangle(r1, r2) {
	
	var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
	
	hit = false;
	
  	r1.centerX = r1.x;
  	r1.centerY = r1.y;
  	r2.centerX = r2.x;
  	r2.centerY = r2.y;

  	r1.halfWidth = r1.width / 2;
  	r1.halfHeight = r1.height / 2;
  	r2.halfWidth = r2.width / 2;
  	r2.halfHeight = r2.height / 2;

  	vx = r1.centerX - r2.centerX;
  	vy = r1.centerY - r2.centerY;

  	combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  	combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  	if (Math.abs(vx) < combinedHalfWidths){

		if (Math.abs(vy) < combinedHalfHeights){

	  		hit = true;
		}else{

	  		hit = false;	
		}
  	}else{

		hit = false;
  	}

  	return hit;
}

function calculateDistance(obj0, obj1){

	var distance, dx, dy, spod;
	
	dx = obj0.x - obj1.x;
	dy = obj0.y - obj1.y;
	
	spod = Math.pow(dx,2) + Math.pow(dy,2);
	distance = Math.pow(spod, 0.5);
	
	return Math.ceil(distance);
}

function calculateSlope(obj, obj1){

	return Math.atan2(obj.y - obj1.y, obj.x - obj1.x);
}

function randomInt(min, max){

	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rotateElliptic(object, xCentre, yCentre, a, b, i){

	object.x = xCentre + (a * Math.cos(i));
	object.y = yCentre + (b * Math.sin(i));
		
}

function particalEffect(beginX, beginY, angle){
	
	var emitter = new Proton.Emitter();
	
	emitter.rate = new Proton.Rate(10);
	
	emitter.addInitialize(new Proton.Body(path + '/spaceEffects_006.png'));
	//emitter.addInitialize(new Proton.Radius(1, 12));
	emitter.addInitialize(new Proton.Life(1));
	emitter.addInitialize(new Proton.Velocity(3, Proton.getSpan(angle, angle+20), 'polar'));

	//emitter.addBehaviour(new Proton.Color('FFFFFF', 'random'));
	emitter.addBehaviour(new Proton.Alpha(1, 0));
	emitter.p.x = beginX;
	emitter.p.y = beginY;
	emitter.emit('once');

	proton.addEmitter(emitter);

}

function meteorCrashEffect(beginX, beginY, angle, factor){
	
	var emitter = new Proton.Emitter();
	
	emitter.rate = new Proton.Rate(10 * factor);
	
	emitter.addInitialize(new Proton.Body(path + 'spaceMeteors_004.png'));
	//emitter.addInitialize(new Proton.Radius(1, 12));
	emitter.addInitialize(new Proton.Life(1));
	emitter.addInitialize(new Proton.Velocity(3, Proton.getSpan(angle, angle + 180 * factor), 'polar'));

	//emitter.addBehaviour(new Proton.Color('FFFFFF', 'random'));
	emitter.addBehaviour(new Proton.Alpha(1, 0.5));
	emitter.addBehaviour(new Proton.Scale(.01, .01));
	emitter.addBehaviour(new Proton.Rotate(Proton.getSpan(0, 360), new Proton.Span([-1, -2, 0, 1, 2]), 'add'));
	emitter.p.x = beginX;
	emitter.p.y = beginY;
	emitter.emit('once');

	proton.addEmitter(emitter);

}

function playerMotors(beginX, beginY, angle, factor = 1){
	
	var emitter = new Proton.Emitter();
	
	emitter.rate = new Proton.Rate(10 * factor);
	
	emitter.addInitialize(new Proton.Body(path + '/spaceEffects_006.png'));
	//emitter.addInitialize(new Proton.Radius(1, 12));
	emitter.addInitialize(new Proton.Life(0.5));
	//emitter.addInitialize(new Proton.Velocity(3, Proton.getSpan(300, 320), 'polar'));

	emitter.addInitialize(new Proton.Position(new Proton.LineZone(beginX, beginY, beginX, beginY)));
	emitter.addInitialize(new Proton.Velocity(new Proton.Span(1, 3), angle, 'polar'));

	
	emitter.addBehaviour(new Proton.Alpha(0.5, 0));
	emitter.addBehaviour(new Proton.Scale(Proton.getSpan(.1, .3), .7));
	
	emitter.emit('once');

	proton.addEmitter(emitter);

}


function getAllUrlParams(url) {

	var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

	var obj = {};

	if (queryString) {

		queryString = queryString.split('#')[0];

		var arr = queryString.split('&');

		for (var i=0; i<arr.length; i++) {
			var a = arr[i].split('=');

			var paramNum = undefined;
			var paramName = a[0].replace(/\[\d*\]/, function(v) {
				paramNum = v.slice(1,-1);
				return '';
			});

			var paramValue = typeof(a[1])==='undefined' ? true : a[1];

			paramName = paramName.toLowerCase();
			paramValue = paramValue.toLowerCase();

			if (obj[paramName]) {
				if (typeof obj[paramName] === 'string') {
					obj[paramName] = [obj[paramName]];
				}
				if (typeof paramNum === 'undefined') {
					obj[paramName].push(paramValue);
				}
				else {
					obj[paramName][paramNum] = paramValue;
				}
			}
			else {
				obj[paramName] = paramValue;
			}
		}
	}

  return obj;
}

function loadLevel(location){
	
	level = location.substring(5);
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "assets/levels/level" + level + ".json", false);
	xhr.send();

	if (xhr.status < 200 || xhr.status >= 300) {
		console.log("XHR failed.");
		return;
	} else {
		data = JSON.parse(xhr.responseText);
		matrix = data.matrix;
	}
	
	container.removeChild(pShip);
	
	pBullets.forEach(function(element){
		container.removeChild(element);
	});
	pBullets.length = 0;
	
	eBullets.forEach(function(element){
		container.removeChild(element);
	});
	eBullets.length = 0;
	
	eShips.forEach(function(element){
		container.removeChild(element);
	});
	eShips.length = 0;
	
	meteors.forEach(function(element){
		container.removeChild(element);
	});
	meteors.length = 0;
	
	radars.forEach(function(element){
		container.removeChild(element);
	});
	radars.length = 0;
	
	items.forEach(function(element){
		container.removeChild(element);
	});
	items.length = 0;
	
	stations.forEach(function(element){
		container.removeChild(element);
	});
	stations.length = 0;
	
	warps.forEach(function(element){
		container.removeChild(element);
	});
	warps.length = 0;
	
	for(var i = 0; i < matrix.length; i++){
		for(var j = 0; j < matrix[0].length; j++){
			itemID++;
			if(matrix[i][j] == 'M'){
				var meteor = new Meteor(meteorTexture, breakEffects);
				meteor.id = itemID;
				meteor.x = (j-10) * xStep + 0.5 * xStep;
				meteor.y = (i-10) * yStep + 0.5 * xStep;
				meteor.width = xStep;
				meteor.height = xStep;
				meteor.s = Math.PI/3600;
				meteor.calculateRotParams();
				meteor.state = "free";
				meteors.push(meteor);
				
				container.addChild(meteor);
			} else if (matrix[i][j] == 'W') {
				var meteor = new Meteor(meteorTexture, breakEffects);
				meteor.id = itemID;
				meteor.x = (j-10) * xStep + 0.5 * xStep;
				meteor.y = (i-10) * yStep + 0.5 * xStep;
				meteor.width = xStep;
				meteor.height = xStep;
				meteor.s = -Math.PI/3600;

				meteor.calculateRotParams();
				meteor.state = "free";
				meteors.push(meteor);
				
				container.addChild(meteor);
			}
			else if(matrix[i][j] == 'P'){
				pShip = new playerShip(shipTexture);
				pShip.id = itemID;
				pShip.width = xStep;
				pShip.height = xStep;
				pShip.x = (j-10) * xStep + 0.5 * xStep;
				pShip.y = (i-10) * yStep + 0.5 * xStep;
				pShip.bulletTextures["energyBullet"] = playerEnergyBulletTexture;
				pShip.effectTextures["breakEffect"] =  shipBreakEffect;
				pShip.effectTextures["transportMeteorEffect"] = transportMeteorItem;
				pShip.deathItemsTextures = pDeathItems;
				container.addChild(pShip);
				
				container.x = x/2 - pShip.x;
				container.y = adLoc/2 - pShip.y;
				if (container.x < -x) {
					container.x = -x;
				} else if (container.x > x) {
					container.x = x;
				}
				if (container.y < -adLoc) {
					container.y = -adLoc;
				} else if (container.y > adLoc) {
					container.y = adLoc;
				}
			}
			else if(matrix[i][j] == '1'){
				var enemy = new Enemy1(shipTexture1);
				enemy.id = itemID;
				enemy.width = xStep;
				enemy.height = xStep;
				enemy.x = (j-10) * xStep + 0.5 * xStep;
				enemy.y = (i-10) * yStep + 0.5 * xStep;
				enemy.rotation = j > 5 ?  (Math.PI / 2) : (3 * Math.PI / 2);
				enemy.bulletTextures["energyBullet"] = enemyEnergyBulletTexture;
				enemy.deathItemsTextures = eDeathItems;
				enemy.effectTextures["gasEffect"] = breakEffects;
				eShips.push(enemy);
				
				container.addChild(enemy);
				
				var frontRadar = new Radar(enemyOneRadar, enemy, Math.PI / 2);
				frontRadar.width = xStep * 2;
				frontRadar.height = xStep * 2;
				frontRadar.x = enemy.x + 1.5 * xStep;
				frontRadar.y = enemy.y;
				frontRadar.alpha = 0.5;
				radars.push(frontRadar);
				container.addChild(frontRadar);
				
				var endRadar = new Radar(enemyOneRadar, enemy, 3 * Math.PI / 2);
				endRadar.width = xStep * 2;
				endRadar.height = xStep * 2;
				endRadar.x = enemy.x - 1.5 * xStep;
				endRadar.y = enemy.y;
				endRadar.alpha = 0.5;
				radars.push(endRadar);
				container.addChild(endRadar);
				
				enemy.radars.push(frontRadar);
				enemy.radars.push(endRadar);				  
			}
			else if(matrix[i][j] == '2'){
				var enemy = new Enemy2(shipTexture1);
				enemy.id = itemID;
				enemy.width = xStep;
				enemy.height = xStep;
				enemy.x = (j-10) * xStep + 0.5 * xStep;
				enemy.y = (i-10) * yStep + 0.5 * xStep;
				enemy.rotation = j > 5 ?  (Math.PI) : 0;
				enemy.bulletTextures["energyBullet"] = enemyEnergyBulletTexture;
				enemy.deathItemsTextures = eDeathItems;
				enemy.effectTextures["gasEffect"] = breakEffects;
				eShips.push(enemy);
				
				container.addChild(enemy);
				
				var frontRadar = new Radar(enemyOneRadar, enemy, Math.PI);
				frontRadar.width = xStep * 2;
				frontRadar.height = xStep * 2;
				frontRadar.x = enemy.x;
				frontRadar.y = enemy.y + 1.5 * yStep;
				frontRadar.alpha = 0.5;
				radars.push(frontRadar);
				container.addChild(frontRadar);
				
				var endRadar = new Radar(enemyOneRadar, enemy, 0);
				endRadar.width = xStep * 2;
				endRadar.height = xStep * 2;
				endRadar.x = enemy.x;
				endRadar.y = enemy.y - 1.5 * yStep;
				endRadar.alpha = 0.5;
				radars.push(endRadar);
				container.addChild(endRadar);
				
				enemy.radars.push(frontRadar);
				enemy.radars.push(endRadar);	 
			} else if(matrix[i][j] == '3'){
				var enemy = new Enemy3(shipTexture2);
				enemy.id = itemID;
				enemy.width = xStep;
				enemy.height = xStep;
				enemy.x = (j-10) * xStep + 0.5 * xStep;
				enemy.y = (i-10) * yStep + 0.5 * xStep;
				var rand = Math.random();
				enemy.rotation = rand < 0.5 ? ( rand < 0.25 ? 0 : Math.PI/2) : ( rand < 0.75 ? Math.PI : Math.PI/-2);
				enemy.bulletTextures["energyBullet"] = enemyEnergyBulletTexture;
				enemy.deathItemsTextures = eDeathItems;
				eShips.push(enemy);
				container.addChild(enemy);
				
				var frontRadar = new Radar(enemyOneRadar, enemy, Math.PI);
				frontRadar.width = xStep * 1.5;
				frontRadar.height = xStep * 1.2;
				frontRadar.x = enemy.x;
				frontRadar.y = enemy.y + 1.5 * yStep;
				frontRadar.alpha = 0.5;
				radars.push(frontRadar);
				container.addChild(frontRadar);
				enemy.radars.push(frontRadar);
			} else if(matrix[i][j] == '4'){
				var enemy = new Enemy4(shipTexture3);
				enemy.id = itemID;
				enemy.width = xStep;
				enemy.height = xStep;
				enemy.x = (j-10) * xStep + 0.5 * xStep;
				enemy.y = (i-10) * yStep + 0.5 * xStep;
				var rand = Math.random();
				enemy.rotation = rand < 0.5 ? ( rand < 0.25 ? 0 : Math.PI/2) : ( rand < 0.75 ? Math.PI : Math.PI/-2);
				enemy.bulletTextures["energyBullet"] = enemyEnergyBulletTexture;
				enemy.deathItemsTextures = eDeathItems;
				eShips.push(enemy);
				container.addChild(enemy);
				
				if (enemy.rotation == Math.PI || enemy.rotation == 0) {
					var frontRadar = new Radar(enemyOneRadar, enemy, Math.PI);
					frontRadar.width = xStep * 2;
					frontRadar.height = xStep * 2;
					frontRadar.x = enemy.x;
					frontRadar.y = enemy.y + 1.5 * yStep;
					frontRadar.alpha = 0.5;
					radars.push(frontRadar);
					container.addChild(frontRadar);
					
					var endRadar = new Radar(enemyOneRadar, enemy, 0);
					endRadar.width = xStep * 2;
					endRadar.height = xStep * 2;
					endRadar.x = enemy.x;
					endRadar.y = enemy.y - 1.5 * yStep;
					endRadar.alpha = 0.5;
					radars.push(endRadar);
					container.addChild(endRadar);
				} else {
					var frontRadar = new Radar(enemyOneRadar, enemy, Math.PI / 2);
					frontRadar.width = xStep * 2;
					frontRadar.height = xStep * 2;
					frontRadar.x = enemy.x + 1.5 * xStep;
					frontRadar.y = enemy.y;
					frontRadar.alpha = 0.5;
					radars.push(frontRadar);
					container.addChild(frontRadar);
					
					var endRadar = new Radar(enemyOneRadar, enemy, 3 * Math.PI / 2);
					endRadar.width = xStep * 2;
					endRadar.height = xStep * 2;
					endRadar.x = enemy.x - 1.5 * xStep;
					endRadar.y = enemy.y;
					endRadar.alpha = 0.5;
					radars.push(endRadar);
					container.addChild(endRadar);
				}
				enemy.radars.push(frontRadar);
				enemy.radars.push(endRadar);	   
				
			} else if (matrix[i][j] == 'S' || matrix[i][j] == 's') {
				// Do nothing
			} else if(matrix[i][j] == 'I'){
			    var station1 = new Station1(station1Texture);
			    station1.width = 2.5 * xStep;
			    station1.height = 5 * xStep;
			    station1.x = (j-10) * xStep + 1.25 * xStep;
			    station1.y = (i-10) * yStep + 2.5 * xStep;
			    station1.bulletTextures["energyBullet"] = enemyEnergyBulletTexture;
			    station1.shipsTextures["1"] = shipTexture1;
			    container.addChild(station1);
			    stations.push(station1);
			    var leftRadar = new Radar(station1Radar, station1, 0);
			    leftRadar.width = 5 * xStep;
			    leftRadar.height = 15 * xStep;
			    leftRadar.x = station1.x - xStep * 6.25;
			    leftRadar.y = station1.y;
			    leftRadar.alpha = 0.3;
			    station1.radars.push(leftRadar);
			    radars.push(leftRadar);
			    container.addChild(leftRadar);
			    
			    var rightRadar = new Radar(station1Radar, station1, Math.PI);
			    rightRadar.width = 5 * xStep;
			    rightRadar.height = 15 * xStep;
			    rightRadar.x = station1.x + xStep * 6.25;
			    rightRadar.y = station1.y;
			    rightRadar.alpha = 0.3;
			    station1.radars.push(rightRadar);
			    radars.push(rightRadar);
			    container.addChild(rightRadar);
			} else {
				eval(data[matrix[i][j]]);
			}
		}
	}
}

window.onload = function(){
	
	app = new PIXI.Application(x, y, {backgroundColor : 0xFFFFFF});
	document.body.appendChild(app.view);
	game();
	
	/*for(var i = 0; i < eShips.length; i++){
		console.log(eShips[i].id);
	}*/
}
