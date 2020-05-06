//TODO: Random background or button to switch background

const cvs = document.querySelector(".game-canvas");
const ctx = cvs.getContext("2d");

let frames = 0;

const RADIAN_CONVERSION = Math.PI / 180;

// Load sprite image
const sprite = new Image();
sprite.src = "img/sprite.png";

// Load sounds
const scoreSound = new Audio();
scoreSound.src = "audio/sfx_point.wav";
const flapSound = new Audio();
flapSound.src = "audio/sfx_flap.wav";
const hitSound = new Audio();
hitSound.src = "audio/sfx_hit.wav";
const swooshingSound = new Audio();
swooshingSound.src = "audio/sfx_swooshing.wav";
const deathSound = new Audio();
deathSound.src = "audio/sfx_die.wav";

// Score object
const score = {
    value: 0,
    best: parseInt(localStorage.getItem("best")) || 0,
    vX: 185,
    vY: 95,
    bX: 185,
    bY: 135,

    reset() {
        this.value = 0;
    },

    draw() {
        ctx.fillStyle = "white";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.textAlign = "center";

        if (gameState.current === gameState.game) {
            this.vX = cvs.width / 2;
            this.vY = 50;
            ctx.font = "35px Teko";
            ctx.fillText(this.value, this.vX, this.vY);
            ctx.strokeText(this.value, this.vX, this.vY);
        } else if (gameState.current === gameState.over) {
            this.vX = 185;
            this.vY = 95;
            ctx.font = "25px Teko";
            ctx.fillText(this.value, gameOver.x + this.vX, gameOver.y + this.vY);
            ctx.strokeText(this.value, gameOver.x + this.vX, gameOver.y + this.vY);
            ctx.fillText(this.best, gameOver.x + this.bX, gameOver.y + this.bY);
            ctx.strokeText(this.best, gameOver.x + this.bX, gameOver.y + this.bY);
        }
    }
}

// Gamestate
const gameState = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
}

const background = {
    sX: 0,
    sY: 0,
    w: 276,
    h: 228,
    x: 0,
    y: cvs.height - 228,
    draw() {
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        // Draw same image to the right, to fill canvas
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    }
}

const foreground = {
    sX: 276,
    sY: 0,
    w: 224,
    h: 112,
    x: 0,
    y: cvs.height - 112,
    dX: 2,

    update() {
        if (gameState.current === gameState.over) return;
        this.x -= 2;
        if (this.x <= -this.w / 2) {
            this.x = 0;
        }
    },

    draw() {
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        // Draw same image to the right, to fill canvas
        ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
    }
}

const bird = {
    animation: [
        { sX: 276, sY: 114 },
        { sX: 276, sY: 140 },
        { sX: 276, sY: 166 },
        { sX: 276, sY: 140 }
    ],
    w: 34,
    h: 24,
    x: 50,
    y: 185,
    radius: 12,
    frame: 0,
    period: 10,
    speed: 0,
    gravity: 0.25,
    // jump: 4.6,
    jump: 6,
    rotation: 0,

    speedReset() {
        this.speed = 0;
    },

    update() {
        if (gameState.current === gameState.getReady) {
            this.period = 10;
            this.y = 185;
            this.speed = 0;
            this.rotation = 0;
        } else {
            this.period = 5;
            this.speed += this.gravity;
            this.y += this.speed;

            if (this.y + this.h / 2 >= cvs.height - foreground.h) {
                this.y = cvs.height - foreground.h - this.h / 2;
                if (gameState.current === gameState.game) {
                    gameState.current = gameState.over;
                    deathSound.play();
                }
            }

            // Stop bird from flying over pipes
            if (this.y <= 0 && gameState.current === gameState.game) {
                gameState.current = gameState.over;
                deathSound.play();
            }

            if (this.speed >= this.jump) {
                this.rotation = 90 * RADIAN_CONVERSION;
            } else {
                this.rotation = -25 * RADIAN_CONVERSION;
            }
        }

        // Don't flap when falling down
        if (this.speed >= this.jump) {
            this.frame = 1;
        } else {
            this.frame = (frames % this.period === 0) ? (this.frame + 1) % this.animation.length : this.frame; 
        }
    },

    draw() {
        let bird = this.animation[this.frame];
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(sprite, bird.sX, bird.sY, this.w, this.h, -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    },

    flap() {
        this.speed -= this.jump;
    }
}

const getReady = {
    sX: 0,
    sY: 228,
    w: 174,
    h: 152,
    x: cvs.width / 2 - 174 / 2,
    y: 120,

    draw() {
        if (gameState.current === gameState.getReady) {
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
}

const gameOver = {
    sX: 174,
    sY: 228,
    w: 226,
    h: 200,
    x: cvs.width / 2 - 226 / 2,
    y: 70,

    draw() {
        if (gameState.current === gameState.over) {
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
    }
}

const pipes = {
    positions: [],

    bottom: {
        sX: 502,
        sY: 0
    },

    top: {
        sX: 554,
        sY: 0
    },

    w: 52,
    h: 400,
    // gap: 85,
    gap: 100,
    dX: 2,
    maxYPos: -150,

    reset() {
        this.positions.length = 0;
    },

    update() {
        if (gameState.current !== gameState.game) return;
        if (frames % 100 === 0) {
            this.positions.push(
                {
                    x: cvs.width,
                    y: this.maxYPos * (Math.random() + 1)
                }
            );
        }
        this.positions.forEach(position => {
            const bottomPipeY = position.y + this.h + this.gap;

            // Check if pipe collided with bird
            // Top pipe
            if (
                // Right of bird
                bird.x + bird.radius > position.x
                // Left of bird
                && bird.x - bird.radius < position.x + this.w
                // Top of bird
                && bird.y - bird.radius < position.y + this.h
                // Bottom of bird
                && bird.y + bird.radius > position.y
            // Bottom pipe
                // Right of bird
                || bird.x + bird.radius > position.x
                // Left of bird
                && bird.x - bird.radius < position.x + this.w
                // Top of bird
                && bird.y - bird.radius < bottomPipeY + this.h
                // Bottom of bird
                && bird.y + bird.radius > bottomPipeY) {

                gameState.current = gameState.over;
                hitSound.play();
                deathSound.play();

                score.best = Math.max(score.best, score.value);
                localStorage.setItem("best", score.best);
            }

            position.x -= this.dX;
        });

        // Remove first pipe from array if it left the screen
        if (this.positions.length > 0 && this.positions[0].x + this.w <= 0) {
            this.positions.shift();
            score.value += 1;
            scoreSound.play();
        }
    },

    draw() {
        if (gameState.current === gameState.game) {
            this.positions.forEach(position => {
                const topYPos = position.y;
                const bottomYPos = position.y + this.h + this.gap;
                ctx.drawImage(sprite, this.top.sX, this.top.sY, this.w, this.h, position.x, topYPos, this.w, this.h);
                ctx.drawImage(sprite, this.bottom.sX, this.bottom.sY, this.w, this.h, position.x, bottomYPos, this.w, this.h);
            });
        }
    }
}

const medals = {
    platinum: {
        sX: 312,
        sY: 112
    },

    gold: {
        sX: 312,
        sY: 158
    },

    silver: {
        sX: 360,
        sY: 112
    },

    bronze: {
        sX: 360,
        sY: 158
    },

    w: 44,
    h: 44,
    x: gameOver.x + 26,
    y: gameOver.y + 87,

    draw() {
        if (gameState.current === gameState.over) {
            let metal;
            if (score.value >= 10) metal = this.bronze;
            if (score.value >= 25) metal = this.silver;
            if (score.value >= 50) metal = this.gold;
            if (score.value >= 100) metal = this.platinum;
            if (score.value >= 10) {
                ctx.drawImage(sprite, metal.sX, metal.sY, this.w, this.h, this.x, this.y, this.w, this.h);
            }
        }
    }
}

function update() {
    bird.update();
    foreground.update();
    pipes.update();
}

function draw() {
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    background.draw();
    pipes.draw();
    foreground.draw();
    bird.draw();
    getReady.draw();
    gameOver.draw();
    medals.draw();
    score.draw();
}

function loop() {
    update();
    draw();
    frames++;
    setTimeout(loop, 16.65)
    // requestAnimationFrame(loop);
}

cvs.addEventListener("click", (e) => {
    switch (gameState.current) {
        case gameState.getReady:
            swooshingSound.play();
            gameState.current = gameState.game;
            break;
        case gameState.game:
            bird.flap();
            flapSound.currentTime = 0;
            flapSound.play();
            break;
        case gameState.over:
            const click = {
                x: e.x - e.target.offsetLeft,
                y: e.y - e.target.offsetTop,
            }
            if (click.x > 135 && click.x < 215 && click.y > 260 && click.y < 283) {
                pipes.reset();
                score.reset();
                bird.speedReset();
                gameState.current = gameState.getReady;
            }
            break;
        default:
            console.error("Encountered invalid gameState", gameState.current);
    }
});

loop();