var canvas = document.getElementById('game');
var context = canvas.getContext('2d');

var grid = 16;
var count = 0;

var snake = {
    x: 160,
    y: 160,
    dx: grid,
    dy: 0,
    cells: [],
    maxCells: 4,
    color: 'green'
};

var apple = {
    x: 320,
    y: 320
};

var obstacles = []; // array para almacenar los obstáculos
var obstacleSize = grid; // el tamaño de cada obstáculo (el mismo que el de la serpiente)
var obstacleFactor = 2; // setea segun la dificultad (ya abajo se config el dropdown)
var obstacleMaxCount = 10; // max de obstáculos que aparecerán
var difficulty = "medium"; // valor predeterminado
var score = 0;
var bestScore = 0;
var lastScoreIncrement = 0;
var gamePaused = false;
var gameOver = false;
var gameOverTransition = 0;
var gameOverTimer = 0;
var gameOverMessageDelay = 1000; 
var gameOverMessageDisplayed = false; 
var baseSpeed = 100;
var currentSpeed = baseSpeed;
var speedIncrement = 50;
let isTextVisible = true; // Estado inicial de visibilidad
let textBlinkCounter = 0; // Contador para controlar el titileo
const blinkRate = 7; 
var gameState = 'menu'; // Estados: 'menu', 'playing', 'gameOver'

var pauseImage = new Image();
pauseImage.src = 'assets/pausasnake.png'; 

var gameOverImage = new Image();
gameOverImage.src = 'assets/gameover.png';

var skullImage = new Image();
skullImage.src = 'assets/calavera.png'; 

const menuMusic = new Audio('assets/intromusic.mp3'); // musica del main menu
const gameOverMusic = new Audio('assets/gameovermusic.mp3'); // musica de Game Over
const gameMusic = new Audio('assets/ingamesong.mp3'); // musica del juego

var titleX = -200; 
var menuY = 150;

// esto es para actualizar el puntaje en el HTML
function updateScoreDisplay() {
    document.getElementById('best-score').textContent = 'Mejor: ' + bestScore + ' pts';
    document.getElementById('current-score').textContent = 'Actual: ' + score + ' pts';
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function drawScore() {
    context.fillStyle = 'white';
    context.font = '8px "Press Start 2P", cursive';
    context.fillText('Best: ' + bestScore + ' pts', 10, 20);
    context.fillText('Now: ' + score + ' pts', 10, 40);
}

function drawGameOver() {
    context.drawImage(gameOverImage, 0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(255, 0, 0, ' + gameOverTransition + ')';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    if (gameOverTransition >= 1 && gameOverTimer >= gameOverMessageDelay) {
        context.fillStyle = 'white';
        context.font = '15px "Press Start 2P", cursive'; 
        const line1 = 'Perdiste!';
        context.fillText(line1, canvas.width / 2 - context.measureText(line1).width / 2, canvas.height / 2 + 30); // aca ajuste el valor de la transc.

        context.font = '10px "Press Start 2P", cursive'; 
        const line2 = 'x Apreta [R] para volver a jugar x';
        context.fillText(line2, canvas.width / 2 - context.measureText(line2).width / 2, canvas.height / 2 + 45); // menos espacio entre líneas

        context.drawImage(skullImage, canvas.width / 2 - 30, canvas.height / 2 - 100, 60, 60); // ajusta la position de la imagen
    }
}

function drawPauseMenu() {
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.drawImage(pauseImage, canvas.width / 2 - 100, canvas.height / 2 - 80, 200, 100);

    const optionsHeight = 120;
    const optionsY = canvas.height / 2 + 50; 
    const optionsWidth = 200;
    
    context.fillStyle = 'green'; 
    context.fillRect(canvas.width / 2 - optionsWidth / 2, optionsY, optionsWidth, optionsHeight);
    
    context.fillStyle = 'white';
    context.font = '10px "Press Start 2P", cursive'; 
    context.fillText('PAUSA', canvas.width / 2 - 50, canvas.height / 2 - 10);
    
    const option1 = 'C para Continuar';
    const option2 = 'R para reiniciar';
    const option3 = 'Q para Salir';

    context.fillText(option1, canvas.width / 2 - context.measureText(option1).width / 2, optionsY + 30);
    context.fillText(option2, canvas.width / 2 - context.measureText(option2).width / 2, optionsY + 60);
    context.fillText(option3, canvas.width / 2 - context.measureText(option3).width / 2, optionsY + 90);
}

function drawApple() {
    context.fillStyle = 'red';
    context.beginPath();
    context.arc(apple.x + grid / 2, apple.y + grid / 2, grid / 2, 0, Math.PI * 2, true);
    context.fill();

    context.fillStyle = '#7FFF00'; 
    context.beginPath();
    context.moveTo(apple.x + grid / 2, apple.y + grid / 2 - 5);
    context.lineTo(apple.x + grid / 2 + 5, apple.y + grid / 2 - 15);
    context.lineTo(apple.x + grid / 2 - 5, apple.y + grid / 2 - 15);
    context.closePath();
    context.fill();
}

function drawSnake() {
    snake.cells.forEach(function(cell, index) {
        context.fillStyle = snake.color;
        context.beginPath();
        context.arc(cell.x + grid / 2, cell.y + grid / 2, grid / 2 - 1, 0, Math.PI * 2);
        context.fill();

        if (index === 0) {
            context.fillStyle = 'white';
            context.beginPath();
            context.arc(cell.x + grid / 4, cell.y + grid / 4, grid / 8, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.arc(cell.x + (3 * grid) / 4, cell.y + grid / 4, grid / 8, 0, Math.PI * 2);
            context.fill();

            context.fillStyle = 'black';
            context.beginPath();
            context.arc(cell.x + grid / 4, cell.y + grid / 4, grid / 16, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.arc(cell.x + (3 * grid) / 4, cell.y + grid / 4, grid / 16, 0, Math.PI * 2);
            context.fill();

            drawTongue(cell);
            context.stroke();
        }
    });
}

function drawTongue(headCell) {
    const tongueLength = 10; 
    const tongueWidth = 2; 
    const tongueOffset = 5;

    let startX = headCell.x + grid / 2;
    let startY = headCell.y + grid / 2;

    let endX = startX;
    let endY = startY;

    const oscillation = Math.sin(Date.now() / 100) * 5;

    //direcciones en la que se mueve la lengua
    if (snake.dx > 0) {
        endX = startX + tongueLength;
        endY = startY + oscillation; 
    } else if (snake.dx < 0) {
        endX = startX - tongueLength;
        endY = startY + oscillation;
    } else if (snake.dy > 0) {
        endX = startX + oscillation; 
        endY = startY + tongueLength;
    } else if (snake.dy < 0) {
        
        endX = startX + oscillation; 
        endY = startY - tongueLength;
    }

    // ahora lengua es una curva
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(
        startX + (endX - startX) / 2, startY + (endY - startY) / 2, 
        endX, endY 
    );
    context.lineWidth = tongueWidth;
    context.strokeStyle = 'red'; 
    context.stroke();
    context.lineWidth = 1; 
}



function drawObstacles() {
    context.fillStyle = 'yellow'; 
    obstacles.forEach(function(obstacle) {
        context.fillRect(obstacle.x, obstacle.y, obstacleSize, obstacleSize);
    });
}


function drawTitle() {
    context.fillStyle = 'white';
    context.font = '15px "Press Start 2P", cursive';
    context.fillText('SNAKE GAME', titleX, 110);

    // Dibuja la linea de puntos debajo del titulo
    context.fillStyle = 'white';
    context.font = '10px "Press Start 2P", cursive'; 
    const lineY = 120; // Ajusta la pos vertical de la línea
    const lineLength = context.measureText('SNAKE GAME').width;
    const dotSpacing = 7; 
    let dots = '';
    for (let i = 0; i < lineLength / dotSpacing; i++) {
        dots += '.';
    }
    context.fillText(dots, titleX, lineY);
}

function setDifficulty() {
    const difficultySelect = document.getElementById('difficulty');
    difficulty = difficultySelect.value;

    // Configuración para la dificultad
    if (difficulty === "easy") {
        obstacleFactor = 4; // + obstaculos, aparece con menor frecuencia
    } else if (difficulty === "medium") {
        obstacleFactor = 2; // preset normal
    } else if (difficulty === "hard") {
        obstacleFactor = 1; // - obstaculos, aparece con mayor frecuencia
    }
}


function generateObstacles() {
    obstacles = []; // hace un clean de obstaculos que existen
    var maxObstacles = Math.floor(score / obstacleFactor); // cuantos obstaculos generar, de acuerdo al puntaje
    maxObstacles = Math.min(maxObstacles, obstacleMaxCount); // limita el número de obstáculos

    for (var i = 0; i < maxObstacles; i++) {
        var obstacleX, obstacleY;
        // se asegura de que los obstáculos no se generen en la serpiente ni en la manzana
        do {
            obstacleX = getRandomInt(0, canvas.width / grid) * grid;
            obstacleY = getRandomInt(0, canvas.height / grid) * grid;
        } while (isPositionOccupiedBySnake(obstacleX, obstacleY) || (obstacleX === apple.x && obstacleY === apple.y));

        obstacles.push({ x: obstacleX, y: obstacleY });
    }
}

function isPositionOccupiedBySnake(x, y) {
    return snake.cells.some(function(cell) {
        return cell.x === x && cell.y === y;
    });
}

function checkCollisionWithObstacles() {
    var head = snake.cells[0]; // La cabeza de la serpiente

    for (var i = 0; i < obstacles.length; i++) {
        var obstacle = obstacles[i];
        if (head.x === obstacle.x && head.y === obstacle.y) {
            gameOver = true; // Fin del juego si choca con un obst
            gameOverTransition = 0;
            gameOverTimer = 0;
            gameOverMessageDisplayed = false;
            gameOverMusic.play(); // Reproduce ost del Game Over
            return true;
        }
    }

    return false;
}



function mostrarMenu() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawTitle(); 

    context.fillStyle = 'white';
    context.font = '10px "Press Start 2P", cursive'; 
    
    if (isTextVisible) {
        const text1 = 'INSERT COIN';
        const text2 = '[enter]';
        context.fillText(text1, canvas.width / 2 - context.measureText(text1).width / 2, menuY);
        context.fillText(text2, canvas.width / 2 - context.measureText(text2).width / 2, menuY + 30);
    }
}


function loop() {
    requestAnimationFrame(loop);
    if (++count < 4) {
        return;
    }

    count = 0;

    if (gameState === "menu") {
        if (titleX < canvas.width / 2 - 80) {
            titleX += 5; // Velocidad de deslizamiento
        } else {
            menuY = canvas.height / 2; // Mueve el menú a la posición adecuada
        }

        // controla el titilado del texto
        textBlinkCounter++;
        if (textBlinkCounter >= blinkRate) {
            isTextVisible = !isTextVisible; // Cambia la visibilidad
            textBlinkCounter = 0; // Reinicia el contador
        }

        mostrarMenu();
        menuMusic.loop = true; // Reproduce en bucle
        menuMusic.play();
        return;
    } else {
        menuMusic.pause();
        menuMusic.currentTime = 0; // Reinicia la música del menú
    }

    if (gamePaused) {
        drawPauseMenu();
        return;
    }

    if (gameOver) {
        gameOverTimer += 100;

        if (gameOverTransition < 1) {
            gameOverTransition += 0.08;
        }

        drawGameOver();
        if (gameOverTransition >= 1 && !gameOverMusicPlayed) { 
            gameOverMusic.play(); 
            gameOverMusicPlayed = true; 
        }
        return;
    } else {
        gameMusic.pause();
        gameMusic.currentTime = 0; 
        gameOverMusic.pause(); 
        gameOverMusic.currentTime = 0;
    }

    // Generar obstaculos cada vez que la puntuación sea multiplo de 5
    if (score > lastScoreIncrement && score % 5 === 0) {
        lastScoreIncrement = score;
        currentSpeed += speedIncrement;
        snake.color = getRandomColor();
        generateObstacles(); // Generar nuevos obstáculos
    }

    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Mover la serpiente
    snake.x += snake.dx;
    snake.y += snake.dy;

    // Revisar límites de la pantalla y mover la serpiente de forma "envolvente"
    if (snake.x < 0) {
        snake.x = canvas.width - grid;
    } else if (snake.x >= canvas.width) {
        snake.x = 0;
    }

    if (snake.y < 0) {
        snake.y = canvas.height - grid;
    } else if (snake.y >= canvas.height) {
        snake.y = 0;
    }

    // Agregar la nueva cabeza de la serpiente
    snake.cells.unshift({ x: snake.x, y: snake.y });

    // Si la serpiente ha alcanzado el tamaño máximo, eliminar ultimo segmento
    if (snake.cells.length > snake.maxCells) {
        snake.cells.pop();
    }

    
    drawApple();
    drawSnake();

    // Verificar si la serpiente ha comido la manzana
    snake.cells.forEach(function(cell, index) {
        if (cell.x === apple.x && cell.y === apple.y) {
            snake.maxCells++;
            score++;
            if (score > bestScore) {
                bestScore = score;
            }
            apple.x = getRandomInt(0, 25) * grid;
            apple.y = getRandomInt(0, 25) * grid;
        }

        // Verificar si la serpiente se ha chocado asi misma
        for (var i = index + 1; i < snake.cells.length; i++) {
            if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
                gameOver = true;
                gameOverTransition = 0;
                gameOverTimer = 0;
                gameOverMessageDisplayed = false;

                // Detenemos musica del juego al perder
                gameMusic.pause();
                gameMusic.currentTime = 0; // Reinicia  musica juego
            }
        }
    });

    // Verificar si la serpiente choca con obstaculos
    if (checkCollisionWithObstacles()) {
        gameOver = true;
        gameOverTransition = 0;
        gameOverTimer = 0;
        gameOverMessageDisplayed = false;
        
        
        gameMusic.pause();
        gameMusic.currentTime = 0; 
    }

    // Dibujar los obstáculos
    drawObstacles();

    updateScoreDisplay();

    
}


var gameOverMusicPlayed = false; 

function restartGame() {
    snake.x = 160;
    snake.y = 160;
    snake.cells = [];
    obstacles = []; 
    snake.maxCells = 4;
    snake.dx = grid;
    snake.dy = 0;
    score = 0;
    gamePaused = false;
    gameOver = false;
    gameOverTransition = 0;
    gameOverTimer = 0;
    currentSpeed = baseSpeed;
    lastScoreIncrement = 0;
    gameOverMessageDisplayed = false;
    gameOverMusicPlayed = false; // Reiniciar la variable para la música de Game Over

    apple.x = getRandomInt(0, 25) * grid;
    apple.y = getRandomInt(0, 25) * grid;

    snake.color = 'green';
    gameState = 'playing'; // Cambia el estado a jugar

   
    gameOverMusic.pause();
    gameOverMusic.currentTime = 0;
}

document.addEventListener('keydown', function(e) {
    if (gameOver) {
        if (e.which === 82) { // R para reiniciar
            gameMusic.pause(); // detiene la música del juego
            restartGame();
        }
        return;
    }

    if (gamePaused) {
        if (e.which === 67) { // C para continuar
            gamePaused = false;
            gameMusic.play(); 
        } else if (e.which === 82) {
            gameMusic.pause(); // 
            restartGame();
        } else if (e.which === 81) { 
            gameMusic.pause(); // pausa la musica
            restartGame();
            gameState = 'menu';
            titleX = -200;
            return;
        }
        return;
    }

    if (e.which === 27) { // ESC para pausar
        gamePaused = true;
        gameMusic.pause(); // Detiene la música del juego
        return;
    }

    if (gameState === 'menu') {
        if (e.which === 13) { // ENTER para iniciar
            setDifficulty(); // Configura la dificultad
            gameState = 'playing';
            restartGame();
        }
        return;
    }

    if (!gameOver) {
        if (e.which === 37 && snake.dx === 0) {
            snake.dx = -grid;
            snake.dy = 0;
        } else if (e.which === 38 && snake.dy === 0) {
            snake.dy = -grid;
            snake.dx = 0;
        } else if (e.which === 39 && snake.dx === 0) {
            snake.dx = grid;
            snake.dy = 0;
        } else if (e.which === 40 && snake.dy === 0) {
            snake.dy = grid;
            snake.dx = 0;
        }
    }
});

// Reproduce el OST de menu al cargar la página
window.onload = function() {
    menuMusic.loop = true;
    menuMusic.play();
};

loop();















