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
const blinkRate = 7; // Cada cuanto cambia la visibilidad
var gameState = 'menu'; // Estados: 'menu', 'playing', 'gameOver'

var pauseImage = new Image();
pauseImage.src = 'assets/pausasnake.png'; 

var gameOverImage = new Image();
gameOverImage.src = 'assets/gameover.png';

var skullImage = new Image();
skullImage.src = 'assets/calavera.png'; 

const menuMusic = new Audio('assets/intromusic.mp3'); // musica del menú
const gameOverMusic = new Audio('assets/gameovermusic.mp3'); // musica de Game Over
const gameMusic = new Audio('assets/ingamesong.mp3'); // musica del juego

var titleX = -200; 
var menuY = 150;

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
    context.font = '8px "Press Start 2P", cursive'; // Usar la fuente retro
    context.fillText('Best: ' + bestScore + ' pts', 10, 20);
    context.fillText('Now: ' + score + ' pts', 10, 40);
}

function drawGameOver() {
    context.drawImage(gameOverImage, 0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(255, 0, 0, ' + gameOverTransition + ')';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    if (gameOverTransition >= 1 && gameOverTimer >= gameOverMessageDelay) {
        context.fillStyle = 'white';
        context.font = '15px "Press Start 2P", cursive'; // fuente retro
        const line1 = 'Perdiste!';
        context.fillText(line1, canvas.width / 2 - context.measureText(line1).width / 2, canvas.height / 2 + 30); // aca ajuste el valor de la transc.

        context.font = '10px "Press Start 2P", cursive'; 
        const line2 = 'x Apreta [R] para volver a jugar x';
        context.fillText(line2, canvas.width / 2 - context.measureText(line2).width / 2, canvas.height / 2 + 45); // menos espacio entre líneas

        // Dibuja la imagen de la calavera
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

            // Dibuja la lengua de la serpiente según la dirección
            context.strokeStyle = 'red';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(cell.x + grid / 2, cell.y + grid);
            if (snake.dy > 0) { // Abajo
                context.lineTo(cell.x + grid / 2, cell.y + grid + 10);
            } else if (snake.dy < 0) { // Arriba
                context.lineTo(cell.x + grid / 2, cell.y - 10);
            } else if (snake.dx > 0) { // Derecha
                context.lineTo(cell.x + grid + 10, cell.y + grid / 2);
            } else if (snake.dx < 0) { // Izquierda
                context.lineTo(cell.x - 10, cell.y + grid / 2);
            }
            context.stroke();
        }
    });
}

function drawTitle() {
    context.fillStyle = 'white';
    context.font = '15px "Press Start 2P", cursive';
    context.fillText('SNAKE GAME', titleX, 110);

    // Dibuja la linea de puntos debajo del título
    context.fillStyle = 'white';
    context.font = '10px "Press Start 2P", cursive'; 
    const lineY = 120; // Ajusta la pos vertical de la línea
    const lineLength = context.measureText('SNAKE GAME').width;
    const dotSpacing = 7; // Espaciado entre puntos
    let dots = '';
    for (let i = 0; i < lineLength / dotSpacing; i++) {
        dots += '.';
    }
    context.fillText(dots, titleX, lineY);
}

function mostrarMenu() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawTitle(); 

    context.fillStyle = 'white';
    context.font = '10px "Press Start 2P", cursive'; // Fuente retro
    
    // Dibuja el texto solo si está visible
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
        if (gameOverTransition >= 1 && !gameOverMusicPlayed) { // Reproduce música solo si no se ha reproducido
            gameOverMusic.play(); // Reproduce la música de Game Over
            gameOverMusicPlayed = true; // Marca que la música ya se ha reproducido
        }
        return;
    } else {
        // Detenemos la música de juego aquí cuando se produce el Game Over
        gameMusic.pause();
        gameMusic.currentTime = 0; // Reinicia la música de juego
        gameOverMusic.pause(); // Asegúrate de que la música de Game Over se pause
        gameOverMusic.currentTime = 0; // Reinicia la música de Game Over
    }

    if (score > lastScoreIncrement && score % 5 === 0) {
        lastScoreIncrement = score;
        currentSpeed += speedIncrement;
        snake.color = getRandomColor();
    }

    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    snake.x += snake.dx;
    snake.y += snake.dy;

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

    snake.cells.unshift({ x: snake.x, y: snake.y });

    if (snake.cells.length > snake.maxCells) {
        snake.cells.pop();
    }

    drawApple();
    drawSnake();

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

        for (var i = index + 1; i < snake.cells.length; i++) {
            if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
                gameOver = true;
                gameOverTransition = 0;
                gameOverTimer = 0;
                gameOverMessageDisplayed = false;
                
                // Detenemos la música del juego al perder
                gameMusic.pause();
                gameMusic.currentTime = 0; // Reinicia la música de juego
            }
        }
    });

    drawScore();
}

var gameOverMusicPlayed = false; // Nueva variable para controlar la reproducción

function restartGame() {
    snake.x = 160;
    snake.y = 160;
    snake.cells = [];
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

    // Detiene la música de Game Over
    gameOverMusic.pause();
    gameOverMusic.currentTime = 0;
}

document.addEventListener('keydown', function(e) {
    if (gameOver) {
        if (e.which === 82) { // R para reiniciar
            gameMusic.pause(); // Detiene la música del juego
            restartGame();
        }
        return;
    }

    if (gamePaused) {
        if (e.which === 67) { // C para continuar
            gamePaused = false;
            gameMusic.play(); // Reanuda la música del juego
        } else if (e.which === 82) { // R para reiniciar
            gameMusic.pause(); // Detiene la música del juego
            restartGame();
        } else if (e.which === 81) { // Q para salir
            gameMusic.pause(); // Detiene la música del juego
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















