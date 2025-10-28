const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const victoryScreen = document.getElementById('victoryScreen');
const startButton = document.getElementById('startButton');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Configuración Inicial ---
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// --- Carga de Imágenes ---
// Asegúrate de que las rutas y los nombres de los archivos sean correctos.
const playerImg = new Image();
playerImg.src = 'assets/player.png';
const enemyImg = new Image();
enemyImg.src = 'assets/enemy.png';
const playerBulletImg = new Image();
playerBulletImg.src = 'assets/player_bullet.png';
const enemyBulletImg = new Image();
enemyBulletImg.src = 'assets/enemy_bullet.png';

let imagesLoaded = 0;
const totalImages = 4;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        console.log("Todas las imágenes cargadas.");
    }
}

playerImg.onload = imageLoaded;
enemyImg.onload = imageLoaded;
playerBulletImg.onload = imageLoaded;
enemyBulletImg.onload = imageLoaded;
// Manejo simple de errores de carga (opcional)
playerImg.onerror = () => console.error("Error al cargar player.png");
enemyImg.onerror = () => console.error("Error al cargar enemy.png");
playerBulletImg.onerror = () => console.error("Error al cargar player_bullet.png");
enemyBulletImg.onerror = () => console.error("Error al cargar enemy_bullet.png");


// --- Variables del Juego ---
let player = {
    x: GAME_WIDTH / 2 - 25,
    y: GAME_HEIGHT - 100,
    width: 50,
    height: 50,
    lives: 3,
    speed: 5
};

let enemy = {
    x: GAME_WIDTH / 2 - 50,
    y: 50,
    width: 100,
    height: 100,
    health: 15, // DIFICULTAD: 15 impactos
    maxHealth: 15,
    speedX: 2.5, // DIFICULTAD: Movimiento lateral rápido
    bulletSpeed: 7, // DIFICULTAD: Balas enemigas rápidas
    lastShotTime: 0,
    shootInterval: 600 // DIFICULTAD: Alta cadencia de fuego
};

let playerBullets = [];
let enemyBullets = [];

let gameOver = false;
let gameWon = false;

// --- Funciones de Dibujo ---
function drawPlayer() {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

function drawEnemy() {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    // Dibujar barra de vida del enemigo
    ctx.fillStyle = 'red';
    ctx.fillRect(enemy.x, enemy.y - 15, enemy.width, 10);
    ctx.fillStyle = 'lime';
    ctx.fillRect(enemy.x, enemy.y - 15, enemy.width * (enemy.health / enemy.maxHealth), 10);
}

function drawBullets() {
    playerBullets.forEach(bullet => {
        ctx.drawImage(playerBulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
    });
    enemyBullets.forEach(bullet => {
        ctx.drawImage(enemyBulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawHUD() {
    // Vidas del jugador
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Vidas: ${player.lives}`, 10, 30);
}

// --- Lógica de Interacción Móvil (Táctil) ---
let touchX = 0;
let isTouching = false;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Previene el scroll por defecto
    isTouching = true;
    touchX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isTouching) {
        const currentTouchX = e.touches[0].clientX;
        const deltaX = currentTouchX - touchX;
        player.x += deltaX;
        touchX = currentTouchX;

        // Limitar movimiento dentro del canvas
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;
    }
});

canvas.addEventListener('touchend', () => {
    isTouching = false;
});


// --- Lógica de Actualización de Juego ---

function updatePlayerBullets() {
    playerBullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
            playerBullets.splice(index, 1);
        }
        // Colisión con enemigo
        if (checkCollision(bullet, enemy)) {
            enemy.health--;
            playerBullets.splice(index, 1);
            if (enemy.health <= 0) {
                gameWon = true;
                gameOver = true;
            }
        }
    });
}

function updateEnemy() {
    // Movimiento horizontal del enemigo
    enemy.x += enemy.speedX;
    if (enemy.x + enemy.width > GAME_WIDTH || enemy.x < 0) {
        enemy.speedX *= -1; // Invertir dirección
    }

    // Disparo del enemigo: Triple shot DISPERSO
    const currentTime = Date.now();
    if (currentTime - enemy.lastShotTime > enemy.shootInterval) {
        const bulletSpeed = enemy.bulletSpeed;
        const baseBulletX = enemy.x + enemy.width / 2 - 5;
        const bulletY = enemy.y + enemy.height;
        const bulletWidth = 10;
        const bulletHeight = 20;

        // Disparo 1: Central (Recto)
        enemyBullets.push({
            x: baseBulletX,
            y: bulletY,
            width: bulletWidth,
            height: bulletHeight,
            speedX: 0, 
            speedY: bulletSpeed 
        });

        // Disparo 2: Ángulo Izquierda
        enemyBullets.push({
            x: baseBulletX - 15, 
            y: bulletY,
            width: bulletWidth,
            height: bulletHeight,
            speedX: -2.5, // DIFICULTAD: Se dispersa a la izquierda
            speedY: bulletSpeed 
        });

        // Disparo 3: Ángulo Derecha
        enemyBullets.push({
            x: baseBulletX + 15, 
            y: bulletY,
            width: bulletWidth,
            height: bulletHeight,
            speedX: 2.5, // DIFICULTAD: Se dispersa a la derecha
            speedY: bulletSpeed 
        });

        enemy.lastShotTime = currentTime;
    }
}

function updateEnemyBullets() {
    enemyBullets.forEach((bullet, index) => {
        bullet.y += bullet.speedY; 
        bullet.x += bullet.speedX; // Movimiento horizontal disperso

        // Eliminar bala si sale de pantalla (incluyendo los laterales)
        if (bullet.y > GAME_HEIGHT || bullet.x < -bullet.width || bullet.x > GAME_WIDTH) {
            enemyBullets.splice(index, 1);
        }
        
        // Colisión con jugador
        if (checkCollision(bullet, player)) {
            player.lives--;
            enemyBullets.splice(index, 1);
            if (player.lives <= 0) {
                gameOver = true;
                gameWon = false;
            }
        }
    });
}

// Disparo automático del jugador
let playerLastShotTime = 0;
const playerShootInterval = 500; // Dispara cada 0.5 segundos

function playerAutoShoot() {
    const currentTime = Date.now();
    if (currentTime - playerLastShotTime > playerShootInterval) {
        playerBullets.push({
            x: player.x + player.width / 2 - 5,
            y: player.y,
            width: 10,
            height: 20,
            speed: 7
        });
        playerLastShotTime = currentTime;
    }
}


// Función de colisión (simple rectángulo)
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}


// --- Bucle principal del juego (Game Loop) ---
function gameLoop() {
    if (gameOver) {
        if (gameWon) {
            showVictoryScreen();
        } else {
            // Derrota: Volver a la pantalla de inicio
            gameScreen.classList.remove('active');
            startScreen.classList.add('active'); 
            resetGame();
        }
        return;
    }

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawPlayer();
    drawEnemy();
    drawBullets();
    drawHUD();

    playerAutoShoot();
    updatePlayerBullets();
    updateEnemy();
    updateEnemyBullets();

    requestAnimationFrame(gameLoop);
}

// --- Control de Pantallas y Reinicio ---
function startGame() {
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    resetGame();
    gameOver = false;
    gameWon = false;
    requestAnimationFrame(gameLoop);
}

function showVictoryScreen() {
    gameScreen.classList.remove('active');
    victoryScreen.classList.add('active');
}

function resetGame() {
    player.x = GAME_WIDTH / 2 - player.width / 2;
    player.y = GAME_HEIGHT - 100;
    player.lives = 3;

    enemy.x = GAME_WIDTH / 2 - enemy.width / 2;
    enemy.y = 50;
    enemy.health = enemy.maxHealth;
    enemy.lastShotTime = 0;

    playerBullets = [];
    enemyBullets = [];
}


// --- Event Listeners ---
startButton.addEventListener('click', startGame);

// Mostrar la pantalla de inicio al cargar
document.addEventListener('DOMContentLoaded', () => {
    startScreen.classList.add('active');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});