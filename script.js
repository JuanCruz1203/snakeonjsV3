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
var gameOverMessageDisplayed = false; // para saber si se muestra o no el msj
var baseSpeed = 100;
var currentSpeed = baseSpeed;
var speedIncrement = 50;
var pauseImage = new Image();
pauseImage.src = 'assets/pausasnake.png'; 

var gameOverImage = new Image();
gameOverImage.src = 'assets/gameover.png';

var skullImage = new Image();
skullImage.src = 'assets/calavera.png'; 

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
    context.font = '10px Arial';
    context.fillText('Best: ' + bestScore + ' pts', 10, 20);
    context.fillText('Now: ' + score + ' pts', 10, 40);
}

function drawGameOver() {
    context.drawImage(gameOverImage, 0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(255, 0, 0, ' + gameOverTransition + ')';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Mostrar el mensaje 1 segundo después de que la transición comience
    if (gameOverTransition >= 1 && gameOverTimer >= gameOverMessageDelay) {
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.fillText('Perdiste! Apreta R para volver a jugar', canvas.width / 2 - 145, canvas.height / 2 + 10);
        
        // Dibujar la imagen de la calavera
        context.drawImage(skullImage, canvas.width / 2 - 30, canvas.height / 2 - 70, 60, 60); // Ajusta la posición y tamaño
    }
}

function drawPauseMenu() {
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.drawImage(pauseImage, canvas.width / 2 - 100, canvas.height / 2 - 80, 200, 100);

    // area para las opciones
    const optionsHeight = 120;
    const optionsY = canvas.height / 2 + 50; // Ajustar para estar más abajo
    const optionsWidth = 200;
    
    context.fillStyle = 'green'; // Color de fondo verde
    context.fillRect(canvas.width / 2 - optionsWidth / 2, optionsY, optionsWidth, optionsHeight);
    
    context.fillStyle = 'white';
    context.font = '30px Arial';
    context.fillText('PAUSA', canvas.width / 2 - 50, canvas.height / 2 - 10);
    context.font = '20px Arial';

    // Centrar las opciones
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
            context.arc(cell.x + grid / 4, cell.y + grid / 4, grid / 8, 0, Math.PI * 2, true);
            context.fill();
            context.beginPath();
            context.arc(cell.x + (3 * grid) / 4, cell.y + grid / 4, grid / 8, 0, Math.PI * 2, true);
            context.fill();

            context.fillStyle = 'black';
            context.beginPath();
            context.arc(cell.x + grid / 4, cell.y + grid / 4, grid / 16, 0, Math.PI * 2, true);
            context.fill();
            context.beginPath();
            context.arc(cell.x + (3 * grid) / 4, cell.y + grid / 4, grid / 16, 0, Math.PI * 2, true);
            context.fill();

            context.strokeStyle = 'red';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(cell.x + grid / 2, cell.y + grid);
            context.lineTo(cell.x + grid / 2, cell.y + grid + 10);
            context.stroke();
        }
    });
}

function loop() {
    requestAnimationFrame(loop);
    if (++count < 4) {
        return;
    }

    count = 0;

    if (gamePaused) {
        drawPauseMenu();
        return;
    }

    if (gameOver) {
        gameOverTimer += 100;

        // Iniciar la transicion a rojo
        if (gameOverTransition < 1) {
            gameOverTransition += 0.08;
        }

        drawGameOver();
        return;
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
                gameOverMessageDisplayed = false; // reiniciar la flag al perder
            }
        }
    });

    drawScore();
}

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
    gameOverTimer = 0; // para reiniciar el timer
    currentSpeed = baseSpeed;
    lastScoreIncrement = 0;
    gameOverMessageDisplayed = false; // reinicia flag

    apple.x = getRandomInt(0, 25) * grid;
    apple.y = getRandomInt(0, 25) * grid;

    snake.color = 'green';
}

document.addEventListener('keydown', function(e) {
    if (gameOver) {
        if (e.which === 82) {
            restartGame();
        }
        return;
    }

    if (gamePaused) {
        if (e.which === 67) {
            gamePaused = false;
        } else if (e.which === 82) {
            restartGame();
        } else if (e.which === 81) {
            console.log('Salir del juego');
        }
        return;
    }

    if (e.which === 27) {
        gamePaused = true;
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

loop();






