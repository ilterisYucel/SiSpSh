var app,
    proton,
    bg;
    
var path = "./assets/images/";



function game(){
    proton = new Proton();
    
    var renderer = new Proton.PixiRenderer(app.stage);
    proton.addRenderer(renderer);
    
    var bgTexture = new PIXI.Texture.from(path + "starfield.png");
    bg = new PIXI.Sprite(bgTexture);
    bg.x = 0;
    bg.y = 0;
    bg.width = 1003;
    bg.height = 650;
    bg.interactive = true;
    bg.buttonMode = true;
  	bg
        .on('mousedown', createProton); 
    
    app.stage.addChild(bg);
    
    //createProton();
    
    app.ticker.add(function(){
        proton.update();
    });

}

function createProton(){
    
    var emitter = new Proton.Emitter();
    
    emitter.rate = new Proton.Rate(10);
    
    emitter.addInitialize(new Proton.Body(path + '/spaceEffects_006.png'));
    //emitter.addInitialize(new Proton.Radius(1, 12));
    emitter.addInitialize(new Proton.Life(1));
    //emitter.addInitialize(new Proton.Velocity(3, Proton.getSpan(300, 320), 'polar'));
    var y = 60;
    var d = 800;
    emitter.addInitialize(new Proton.Position(new Proton.LineZone( 1003 / 2, y, 1003 / 2, y)));
    emitter.addInitialize(new Proton.Velocity(new Proton.Span(6, 12), 270, 'polar'));

    
    emitter.addBehaviour(new Proton.Alpha(1, 0));
    emitter.addBehaviour(new Proton.Scale(Proton.getSpan(.1, .3), .7));
    //emitter.p.x = 1003 / 2;
    //emitter.p.y = 650 / 2;
    emitter.emit('once');

    proton.addEmitter(emitter);

}


window.onload = function(){
    app = new PIXI.Application(1003, 650, {backgroundColor : 0xFFFFFF});
    document.body.appendChild(app.view);
    game();
    //createProton();
}
