var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;

var path = "./assets/images/";
var level = parseInt(getAllUrlParams().level);
var pShip, app, bg;
var pBullets = [];
var eBullets = [];
var eShips = [];
var meteors = [];
var radars = [];

var adLoc = 0.85 * y;
var factor = (adLoc) / x;
var xStep = x / 10;
var yStep = xStep * factor;
var vFactorX = xStep / 60;
var vFactorY = yStep / 60;

var windowBounds = {
                        x : 0,
                        y : 0,
                        width : x,
                        height : adLoc
                    };
                    
var matrix;

let xhr = new XMLHttpRequest();
xhr.open("GET", "assets/levels/level" + level + ".json", false);
xhr.send();

if (xhr.status < 200 || xhr.status >= 300) {
	console.log("XHR failed.");
} else {
	matrix = JSON.parse(xhr.responseText);
}

class bullet extends PIXI.Sprite{
    constructor(texture, rotation){
        super(texture);
        this.anchor.set(0.5);
        this.rotation = rotation;
    }
}

class energyBullet extends bullet{
    constructor(texture, rotation, effect = 10, factor = 1){
        super(texture, rotation);
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

class playerShip extends Ship{

    constructor(texture, speed = 1, energy = 50, factor = 1, itemList = [], 
                    bulletTextures = {}, deathItemsTextures = [], effectTextures = {}){
        super(texture, energy, factor);
        this.itemList = itemList;
        this.bulletTextures = bulletTextures;
        this.deathItemsTextures = deathItemsTextures;
        this.effectTextures = effectTextures;
        this.readyLauncher = true;
        this.intervalId = 0;
    }
    
    move(direction){
        if(direction == 1){
            this.rotation = Math.PI;
            this.y += this.speedY;
        }
        
        if(direction == 2){
            this.rotation = 0;
            this.y -= this.speedY;
        }
        
        if(direction == 3){
            this.rotation = Math.PI / 2;
            this.x += this.speedX;
        }
        
        if(direction == 4){
            this.rotation = 3 * Math.PI / 2;
            this.x -= this.speedX;
        }
    }
    
    eFire(){
        if(this.readyLauncher){
            var eBullet = new energyBullet(this.bulletTextures["energyBullet"], this.rotation);
            eBullet.width = xStep / 8;
            eBullet.height = xStep / 2;
            eBullet.x = this.x;
            eBullet.y = this.y;
            app.stage.addChild(eBullet);
            pBullets.push(eBullet);
            this.readyLauncher = false;
        }
    }
    
    death(){
        this.deathItemsTextures.forEach(function(texture){
            var sprite = new PIXI.Sprite(texture);
            sprite.x = randomInt(this.x - this.width / 2, this.x + this.width /2);
            sprite.y = randomInt(this.y - this.height / 2, this.y + this.height /2);
            sprite.width = xStep / 2;
            sprite.height = xStep / 2;
            sprite.anchor.set(0.5);
            app.stage.addChild(sprite);
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
    
    controlStatus(){
        this.intervalId = setInterval(function(){
            this.readyLauncher = true;
        }.bind(this),1000);
    }
    
    
}

class Enemy1 extends Ship{

    constructor(texture, energy = 50, factor = 1, itemList = [], 
                    bulletTextures = {}, deathItemsTextures = [], effectTextures={}, radars = []){
        super(texture, energy, factor);
        this.itemList = itemList;
        this.bulletTextures = bulletTextures;
        this.deathItemsTextures = deathItemsTextures;
        this.effectTextures = effectTextures;
        this.radars = radars;
        this.readyLauncher = true;
    }
    
    move(){
        if(contain(this, windowBounds) == undefined){
            this.x += this.speedX * Math.sin(this.rotation);
            this.radars.forEach(function(radar){
                radar.x += this.speedX * Math.sin(this.rotation);
            }.bind(this));         
        }
        else{
            this.rotation = this.rotation + Math.PI;
            this.x += this.speedX * Math.sin(this.rotation);
            this.radars.forEach(function(radar){
                radar.x += this.speedX * Math.sin(this.rotation);
            }.bind(this));         
        }
    }
    
    eFire(){
        if(this.readyLauncher){
            var eBullet = new energyBullet(this.bulletTextures["energyBullet"], this.rotation);
            eBullet.width = xStep / 8;
            eBullet.height = xStep / 2;
            eBullet.x = this.x;
            eBullet.y = this.y;
            app.stage.addChild(eBullet);
            eBullets.push(eBullet);
            this.readyLauncher = false;
        }
        
    }
    
    death(){
        this.deathItemsTextures.forEach(function(texture){
            var sprite = new PIXI.Sprite(texture);
            sprite.x = randomInt(this.x - this.width / 2, this.x + this.width /2);
            sprite.y = randomInt(this.y - this.height / 2, this.y + this.height /2);
            sprite.width = xStep / 2;
            sprite.height = xStep / 2;
            sprite.anchor.set(0.5);
            app.stage.addChild(sprite);
        }.bind(this));
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
    }
    
    breakIt(){
       
        this.breakItemList.forEach(function(texture){
        
            var effect = new PIXI.Sprite(texture);
            effect.x = this.x;
            effect.y = this.y;
            effect.width = this.width;
            effect.height = this.height;
            effect.anchor.set(0.5);
            app.stage.addChild(effect);
            
            setTimeout(function(){
                app.stage.removeChild(effect);
            },200);
        }.bind(this));
    }

}

function game(){

    var bgTexture = new PIXI.Texture.from(path + "starfield.png");
    var shipTexture = new PIXI.Texture.from(path + "spaceShips_001.png");
    var playerEnergyBulletTexture = new PIXI.Texture.fromImage(path + "spaceMissiles_010.png");
    var enemyEnergyBulletTexture = new PIXI.Texture.fromImage(path + "spaceMissiles_011.png");
    var meteorTexture = new PIXI.Texture.fromImage(path + "spaceMeteors_004.png");
    var shipTexture1 = new PIXI.Texture.fromImage(path + "spaceShips_002.png");
    
    var breakerTexture = new PIXI.Texture.fromImage(path + "spaceParts_087.png");
    
    var breakEffect = new PIXI.Texture.fromImage(path + "spaceEffects_009.png");
    var breakEffect1 = new PIXI.Texture.fromImage(path + "spaceEffects_011.png");
    var breakEffect2 = new PIXI.Texture.fromImage(path + "spaceEffects_012.png");
    var breakEffect3 = new PIXI.Texture.fromImage(path + "spaceEffects_013.png");
    var breakEffect4 = new PIXI.Texture.fromImage(path + "spaceEffects_014.png");
    
    
    var breakEffects = [];
    
    breakEffects.push(breakEffect);
    breakEffects.push(breakEffect1);
    breakEffects.push(breakEffect2);
    breakEffects.push(breakEffect3);
    breakEffects.push(breakEffect4);
    
    var shipBreakEffect = new PIXI.Texture.fromImage(path + "spaceEffects_018.png");
    
    var enemyOneRadar = new PIXI.Texture.fromImage(path + "radar.png");
    
    var pDeathItem = new PIXI.Texture.fromImage(path + "spaceParts_001.png");
    var pDeathItem1 = new PIXI.Texture.fromImage(path + "spaceParts_003.png");
    var pDeathItem2 = new PIXI.Texture.fromImage(path + "spaceParts_033.png");
    var pDeathItem3 = new PIXI.Texture.fromImage(path + "spaceParts_042.png");
    
    pDeathItems = [];
    
    pDeathItems.push(pDeathItem);
    pDeathItems.push(pDeathItem1);
    pDeathItems.push(pDeathItem2);
    pDeathItems.push(pDeathItem3);
    
    var eDeathItem = new PIXI.Texture.fromImage(path + "spaceParts_002.png");
    var eDeathItem1 = new PIXI.Texture.fromImage(path + "spaceParts_004.png");
    var eDeathItem2 = new PIXI.Texture.fromImage(path + "spaceParts_040.png");
    var eDeathItem3 = new PIXI.Texture.fromImage(path + "spaceParts_045.png");
    
    eDeathItems = [];
    
    eDeathItems.push(eDeathItem);
    eDeathItems.push(eDeathItem1);
    eDeathItems.push(eDeathItem2);
    eDeathItems.push(eDeathItem3);

    
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
    
    for(var i = 0; i < matrix.length; i++){
        for(var j = 0; j < matrix[0].length; j++){
            if(matrix[i][j] == 'M'){
                var meteor = new Meteor(meteorTexture, breakEffects);
                meteor.x = j * xStep + 0.5 * xStep;
                meteor.y = i * yStep + 0.5 * xStep;
                meteor.width = xStep;
                meteor.height = xStep;
                meteors.push(meteor);
                
                app.stage.addChild(meteor);
            }
            else if(matrix[i][j] == 'P'){
                pShip = new playerShip(shipTexture);
                pShip.width = xStep;
                pShip.height = xStep;
                pShip.x = j * xStep + 0.5 * xStep;
                pShip.y = i * yStep + 0.5 * xStep;
                pShip.bulletTextures["energyBullet"] = playerEnergyBulletTexture;
                pShip.effectTextures["breakEffect"] =  shipBreakEffect;
                pShip.deathItemsTextures = pDeathItems;
                app.stage.addChild(pShip);            
            }
            else if(matrix[i][j] == '1'){
                var enemy = new Enemy1(shipTexture1);
                enemy.width = xStep;
                enemy.height = xStep;
                enemy.x = j * xStep + 0.5 * xStep;
                enemy.y = i * yStep + 0.5 * xStep;
                enemy.rotation = j > 5 ?  (Math.PI / 2) : (3 * Math.PI / 2);
                enemy.bulletTextures["energyBullet"] = enemyEnergyBulletTexture;
                enemy.deathItemsTextures = eDeathItems;
                eShips.push(enemy);
                
                app.stage.addChild(enemy);
                
                var frontRadar = new Radar(enemyOneRadar, enemy, Math.PI / 2);
                frontRadar.width = xStep * 2;
                frontRadar.height = xStep * 2;
                frontRadar.x = enemy.x + 1.5 * xStep;
                frontRadar.y = enemy.y;
                frontRadar.alpha = 0.5;
                radars.push(frontRadar);
                app.stage.addChild(frontRadar);
                
                var endRadar = new Radar(enemyOneRadar, enemy, 3 * Math.PI / 2);
                endRadar.width = xStep * 2;
                endRadar.height = xStep * 2;
                endRadar.x = enemy.x - 1.5 * xStep;
                endRadar.y = enemy.y;
                endRadar.alpha = 0.5;
                radars.push(endRadar);
                app.stage.addChild(endRadar);
                
                enemy.radars.push(frontRadar);
                enemy.radars.push(endRadar);                  
            }
            else if(matrix[i][j] == 'E'){
                var breakerButton = new PIXI.Sprite(breakerTexture);
                breakerButton.x = j * xStep + 0.25 * xStep;
                breakerButton.y = i * yStep + 0.5 * yStep;
                breakerButton.width = xStep;
                breakerButton.height = yStep / 2;
                breakerButton.anchor.set(0.5);
                breakerButton.alpha = 0.5;
                breakerButton.buttonMode = true;
                breakerButton.interactive = true;
                breakerButton
                    .on('mousedown', breakMeteor)
                    .on('mouseup', releaseMeteor)
                    .on('touchstart', breakMeteor)
                    .on('touchend', releaseMeteor);
               
               app.stage.addChild(breakerButton);
            }     
        }
    }
    
    pShip.controlStatus();
    
    eShips.forEach(function(enemy){
        enemy.controlStatus();
    });
    
    app.ticker.add(function(){
        
        pBullets = pBullets.filter(function(bullet){
        
            var ret = true;
            bullet.move();
            
            if(contain(bullet, windowBounds) !== undefined){       
                app.stage.removeChild(bullet);
                ret = false;
            }
            
            eShips.forEach(function(eShip){
                if(hitTestRectangle(eShip, bullet)){
                    eShip.energy -= bullet.effect;
                    app.stage.removeChild(bullet);
                    ret = false;
                }
            });
            
            meteors.forEach(function(meteor){
                if(hitTestRectangle(meteor, bullet)){
                    app.stage.removeChild(bullet);
                    ret = false;
                }
            });
            
            return ret;
        });
        
        eBullets = eBullets.filter(function(bullet){
        
            var ret = true;
            bullet.move();
            
            if(contain(bullet, windowBounds) !== undefined){       
                app.stage.removeChild(bullet);
                ret =  false;
            }
            
            if(hitTestRectangle(pShip, bullet)){
                pShip.energy -= bullet.effect;
                app.stage.removeChild(bullet);
                ret = false;
            }

            meteors.forEach(function(meteor){
                if(hitTestRectangle(meteor, bullet)){
                    app.stage.removeChild(bullet);
                    ret = false;
                }
            });
            
            return ret;
        });
        
        eShips = eShips.filter(function(eShip){
            eShip.move();
            eShip.radars.filter(function(radar){
                if(hitTestRectangle(pShip, radar)){
                    var tempRotation = radar.obj.rotation;
                    radar.obj.factor = 0;
                    radar.obj.rotation = tempRotation + calculateSlope(pShip, radar.obj);
                    radar.obj.eFire();
                    radar.obj.factor = 1;
                    radar.obj.rotation = tempRotation;
                }
                
                if(radar.obj.energy == 0){
                    app.stage.removeChild(radar);
                    return false;
                }
                
                return true;
            });
            
            if(eShip.energy == 0){
                app.stage.removeChild(eShip);
                eShip.death();
                return false;
            }
            return true;
        });
        
        if(pShip.energy == 0){
            app.stage.removeChild(pShip);
            pShip.death();
        }
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
}
		
function touchMove(event){
	
	if(event.target !== null && this.flag && this.startY >= adLoc / 2 && this.startY < adLoc && 
                                                                    contain(pShip, windowBounds) == undefined){
		this.curX = this.data.getLocalPosition(this.parent).x;
		this.curY = this.data.getLocalPosition(this.parent).y;
		if (this.curX - this.startX > 0 && Math.abs(this.curX-this.startX)>Math.abs(this.curY-this.startY)) {
			pShip.move(3)
	    }
	    if(this.curX - this.startX < 0 && Math.abs(this.curX-this.startX)>Math.abs(this.curY-this.startY)){
		    pShip.move(4);				
		}
		if(this.curY - this.startY > 0 && Math.abs(this.curX-this.startX)<Math.abs(this.curY-this.startY)){
			pShip.move(1);						
		}
		if(this.curY - this.startY < 0 && Math.abs(this.curX-this.startX)<Math.abs(this.curY-this.startY)){
		    pShip.move(2);
							
		}
	}
}

function breakMeteor(event){
    
    this.data = event.data;
    this.flag = true;
    
    breakerLoc = pShip.getBreakerLoc();
    
    meteors = meteors.filter(function(meteor){
        var distance = calculateDistance(breakerLoc, meteor);
        if((distance < xStep / 2 || distance < yStep / 2) && !hitTestRectangle(pShip, meteor)){
        
            bg.interactive = false;
            bg.buttonMode = false;
            
            var shipBreakEffect = new PIXI.Sprite(pShip.effectTextures["breakEffect"]);
            shipBreakEffect.x = breakerLoc.x;
            shipBreakEffect.y = breakerLoc.y;
            shipBreakEffect.width = distance;
            shipBreakEffect.height = distance;
            shipBreakEffect.anchor.set(0.5);
            shipBreakEffect.rotation = pShip.rotation;
            app.stage.addChild(shipBreakEffect);
            
            setTimeout(function(){
            
                app.stage.removeChild(meteor);
                meteor.breakIt();
                pShip.energy += 10 * pShip.factor;
                app.stage.removeChild(shipBreakEffect);
                
                bg.interactive = true;
                bg.buttonMode = true;
                
            }, 1000);
            
            return false;
        }
        
        return true;
    });
    
}

function releaseMeteor(){

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

  	if (sprite.x + sprite.width / 2 > container.width) {
    	sprite.x = container.width - sprite.width;
    	collision = "right";
  	}

  	if (sprite.y + sprite.height / 2 > container.height) {
    	sprite.y = container.height - sprite.height;
    	collision = "bottom";
  	}

  	return collision;
}

function hitTestRectangle(r1, r2) {
    
    var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
    
    hit = false;
    
  	r1.centerX = r1.x + r1.width / 2;
  	r1.centerY = r1.y + r1.height / 2;
  	r2.centerX = r2.x + r2.width / 2;
  	r2.centerY = r2.y + r2.height / 2;

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

    var slope, diffX, diffY;
    
    diffX = Math.abs(obj.x - obj1.x);
    diffY = Math.abs(obj.y - obj1.y);
    
    slope = Math.atan(diffY / diffX) * 180 / Math.PI;
    
    return slope;
}

function randomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
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

window.onload = function(){

    //console.log(factor);
    //console.log(adLoc);
    //console.log(yStep);
    //console.log(xStep);
    //console.log(y / xStep);
    //console.log((x - (0.1 * y)) / yStep);
    
    app = new PIXI.Application(x, y, {backgroundColor : 0xFFFFFF});
    document.body.appendChild(app.view);
    game();
}
