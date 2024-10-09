import * as THREE from 'https://unpkg.com/three@0.150.0/build/three.module.js'; // Import Three.js
import { GLTFLoader } from 'https://unpkg.com/three@0.150.0/examples/jsm/loaders/GLTFLoader.js'; // Import GLTFLoader
import { Lerp } from './lerp.js'; // Import your Lerp class

export class Game {
    OBSTACLE_PREFAB = new THREE.BoxBufferGeometry(1, 1, 1);
    OBSTACLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xccddeee });
    BONUS_PREFAB = new THREE.SphereBufferGeometry(1, 12, 12);

    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.loader = new GLTFLoader();
        this._buildUI();
        this._addLighting();
    
        this.running = false;
        this.speedZ = 20;
        this.speedX = 0; // -1: left, 0: straight, 1: right
        this.translateX = 0;
        this.time = 0;
        this.clock = new THREE.Clock();
        this.health = 100;
        this.score = 0;
        this.rotationLerp = null;
        this.cameraLerp = null;

        this.audioManager = setupAudio();
    
        document.addEventListener('keydown', this._keydown.bind(this));
        document.addEventListener('keyup', this._keyup.bind(this));
    
        this.objectsParent = new THREE.Group();
        this.scene.add(this.objectsParent);
    
        // Ensure to call _createSea with the correct context
        this._createSea(); // <-- Ensure this method call is correct
        this._createShip();
        this._reset(false);
    }
    

    update() {
        if (!this.running) return;

        const timeDelta = this.clock.getDelta();
        this.time += timeDelta;

        if (this.rotationLerp !== null) this.rotationLerp.update(timeDelta);
        if (this.cameraLerp !== null) this.cameraLerp.update(timeDelta);

        this._updateGrid(); 
        this._updateSea(); 
        this._checkCollisions(); 
        this._updateInfoPanel(); 
    }

    _reset(replay) {
        this.running = false;


        this.speedZ = 20;
        this.speedX = 0;
        this.translateX = 0;


        this.time = 0;
        this.clock = new THREE.Clock();

        this.health = 100;
        this.score = 0;

        this.rotationLerp = null;
        this.cameraLerp = null;

        this.divScore.innerText = Math.floor(this.score);
        this.divDistance.innerText = 0;
        this.divHealth.value = this.health;

        this._initializeScene(replay);
    }

    _keydown(event) {
        let newSpeedX;
        switch (event.key) {
            case 'ArrowLeft':
                newSpeedX = -1.0;
                break;
            case 'ArrowRight':
                newSpeedX = 1.0;
                break;
            default:
                return;
        }
    
        if (this.speedX !== newSpeedX) {
            this.speedX = newSpeedX;
            this._rotateShip(-this.speedX * 20 * Math.PI / 180, 0.8);
        }
    }
    

    _buildUI() {
        // info panel
        const infoPanel = document.createElement('div');
        infoPanel.id = 'info';
        const infoTitle = document.createElement('div');
        infoTitle.id = 'title';
        infoTitle.innerText = 'Captain\'s log';
        infoPanel.appendChild(infoTitle);
        
        const infoDivider1 = document.createElement('div');
        infoDivider1.className = 'divider';
        infoPanel.appendChild(infoDivider1);

        const infoScore = document.createElement('div');
        infoScore.id = 'score-row';
        const infoScoreLabel = document.createElement('div');
        infoScoreLabel.innerText = 'Score:';
        this.divScore = document.createElement('div');
        this.divScore.id = 'score';
        infoScore.appendChild(infoScoreLabel);
        infoScore.appendChild(this.divScore);
        infoPanel.appendChild(infoScore);

        const infoDistance = document.createElement('div');
        infoDistance.id = 'distance-row';
        const infoDistanceLabel = document.createElement('div');
        infoDistanceLabel.innerText = 'Distance:';
        this.divDistance = document.createElement('div');
        this.divDistance.id = 'distance';
        infoDistance.appendChild(infoDistanceLabel);
        infoDistance.appendChild(this.divDistance);
        infoPanel.appendChild(infoDistance);

        const infoDivider2 = document.createElement('div');
        infoDivider2.className = 'divider';
        infoPanel.appendChild(infoDivider2);

        const infoInputLabel = document.createElement('div');
        infoInputLabel.innerText = 'Ship\'s Integrity:';
        infoPanel.appendChild(infoInputLabel);

        this.divHealth = document.createElement('input');
        this.divHealth.id = 'health';
        this.divHealth.setAttribute('type', 'range');
        this.divHealth.setAttribute('min', 0);
        this.divHealth.setAttribute('max', 100);
        this.divHealth.setAttribute('disabled', true);
        infoPanel.appendChild(this.divHealth);

        document.body.appendChild(infoPanel);

        // intro panel
        const introPanel = document.createElement('div');
        introPanel.id = 'intro-panel';
        const introCol = document.createElement('div');
        introCol.id = 'intro-column';
        const introTitle = document.createElement('div');
        introTitle.id = 'intro-title';
        introTitle.innerText = 'Hyperspeed';
        introCol.appendChild(introTitle);
        const introStartButton = document.createElement('button');
        introStartButton.id = 'start-button';
        introStartButton.innerText = 'Start';
        introStartButton.onclick = () => {
        this.running = true;
        document.getElementById('intro-panel').classList.add('hidden');
        };
        introCol.appendChild(introStartButton);
        introPanel.appendChild(introCol);
        
        document.body.appendChild(introPanel);

        // game over panel
        this.divGameOverPanel = document.createElement('div');
        this.divGameOverPanel.id = 'game-over-panel';
        this.divGameOverPanel.className = 'hidden';
        const gameOverCol = document.createElement('div');
        gameOverCol.id = 'game-over-column';
        
        const gameOverTitle = document.createElement('div');
        gameOverTitle.id = 'game-over-title';
        gameOverTitle.innerText = 'Hyperspeed';
        gameOverCol.appendChild(gameOverTitle);

        const gameOverScore = document.createElement('div');
        gameOverScore.id = 'game-over-score-row';
        const gameOverScoreLabel = document.createElement('div');
        gameOverScoreLabel.innerText = 'Score:';
        this.divGameOverScore = document.createElement('div');
        this.divGameOverScore.id = 'game-over-score';
        gameOverScore.appendChild(gameOverScoreLabel);
        gameOverScore.appendChild(this.divGameOverScore);
        gameOverCol.appendChild(gameOverScore);

        const gameOverDistance = document.createElement('div');
        gameOverDistance.id = 'game-over-distance-row';
        const gameOverDistanceLabel = document.createElement('div');
        gameOverDistanceLabel.innerText = 'Distance:';
        this.divGameOverDistance = document.createElement('div');
        this.divGameOverDistance.id = 'game-over-distance';
        gameOverDistance.appendChild(gameOverDistanceLabel);
        gameOverDistance.appendChild(this.divGameOverDistance);
        gameOverCol.appendChild(gameOverDistance);

        const gameOverReplayButton = document.createElement('button');
        gameOverReplayButton.id = 'replay-button';
        gameOverReplayButton.innerText = 'Replay';
        gameOverReplayButton.onclick = () => {
        this.running = true;
        this.divGameOverPanel.classList.add('hidden');
        };
        gameOverCol.appendChild(gameOverReplayButton);
        this.divGameOverPanel.appendChild(gameOverCol);
        
        document.body.appendChild(this.divGameOverPanel);
    }

    _keyup() {
        this.speedX = 0;
        this._rotateShip(0, 0.5);
    }

    _addLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Bright directional light
        directionalLight.position.set(5, 5, 5).normalize(); // Position it to shine on the objects
        this.scene.add(directionalLight);
    }

    _rotateShip(targetRotation, delay) {
        const $this = this;
        this.rotationLerp = new Lerp(this.ship.rotation.z, targetRotation, delay)
            .onUpdate((value) => { $this.ship.rotation.z = value })
            .onFinish(() => { $this.rotationLerp = null; });
    }

    _updateMovement(timeDelta) {
        this.objectsParent.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Move obstacles and bonuses toward the ship on the Z-axis
                child.position.z -= this.speedZ * timeDelta; 
        
                // Check if the object has gone past the ship
                if (child.position.z < this.ship.position.z - 10) {
                    this._resetObjectPosition(child); // Reset obstacle position
                }
            }
        });
    }
    
    _resetObjectPosition(obj) {
        // Reset object's position to spawn it in front of the ship
        obj.position.set(
            this._randomFloat(-30, 30),  // Random X position
            obj.scale.y * 0.5,           // Y position based on scale
            this.ship.position.z + 50 + this._randomFloat(0, 100) // Spawn it ahead of the ship
        );
    }
    
    // Ensure to include this in your update logic to manage grid and objects
    _updateGrid() {
        // Update sea speed
        this.speedZ += 0.002;

        // Move obstacles and bonuses towards the ship
        this.objectsParent.position.z = this.speedZ * this.time; 
        this.objectsParent.position.x = this.translateX; 

        this.objectsParent.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const childZPos = child.position.z + this.objectsParent.position.z;
                if (childZPos > 0) {
                    const params = [child, -this.translateX, -this.objectsParent.position.z];
                    if (child.userData.type === 'obstacle') {
                        this._setupObstacle(...params);
                    } else {
                        const price = this._setupBonus(...params);
                        child.userData.price = price;
                    }
                }
            }
        });
    }

    _checkCollisions() {
        // Calculate ship's bounding box
        const shipBoundingBox = new THREE.Box3().setFromObject(this.ship);

        // Check against every object (obstacle and bonus)
        this.objectsParent.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Calculate object's bounding box
                const childBoundingBox = new THREE.Box3().setFromObject(child);

                // Check if bounding boxes intersect
                if (shipBoundingBox.intersectsBox(childBoundingBox)) {
                    const params = [child, -this.translateX, -this.objectsParent.position.z];
                    console.log("Collision detected with:", child.userData.type);

                    if (child.userData.type === 'obstacle') {
                        if (soundHit) {
                            soundHit.play();
                        }
                        this.health -= 10;
                        this.divHealth.value = this.health;
                        this._setupObstacle(...params);
                        this._shakeCamera({
                            x: this.camera.position.x,
                            y: this.camera.position.y,
                            z: this.camera.position.z,
                        });
                        if (this.health <= 0)
                            this._gameOver();
                        }
                        else{
                            if (soundAudio) {
                                soundAudio.play();
                            }
                        
                        this._createScorePopup(child.userData.price);
                        this.score += child.userData.price;
                        this.divScore.innerText = this.score;
                        child.userData.price = this._setupBonus(...params);
                    }
                }
            }
        });
    }

    _updateInfoPanel() {
        this.divDistance.innerText = this.objectsParent.position.z.toFixed(0);
    }

    _gameOver() {
        this.running = false;
        this.divGameOverScore.innerText = this.score;
        this.divGameOverDistance.innerText = this.objectsParent.position.z.toFixed(0);
        this.divGameOverPanel.classList.remove('hidden');
        this._reset(true);
    }

    _createShip() {
        if (this.ship) {
            console.warn('Ship model already loaded, skipping creation.');
            return; // If the ship exists, do not load it again
        }

        console.log('Loading GLTF ship model...');
        this.loader.load(
            './assets/model/ship_light.gltf',  // Path to your GLTF model
            (gltf) => {
                console.log('GLTF model loaded successfully:', gltf);
                this.ship = gltf.scene;  // Set the ship model
                this.ship.scale.set(0.1, 0.1, 0.1);  // Adjust size
                this.ship.position.set(0, 0.5, 0);  // Set position
                this.ship.position.z = 2; // Ensure ship is in front of the camera
                this.scene.add(this.ship);  // Add the ship to the scene
            },
            undefined,
            (error) => {
                console.error('An error occurred while loading the GLTF model:', error); // Log error
            }
        );
    }

    _createSea() {
        const seaSize = 200; // Size of the sea
        const seaGeometry = new THREE.PlaneGeometry(seaSize, seaSize); // Create a plane geometry
    
        // Load texture for the sea
        const seaTextureLoader = new THREE.TextureLoader();
        const seaTexture = seaTextureLoader.load('./assets/image/water.jpg'); // Use your texture image path
        seaTexture.wrapS = THREE.RepeatWrapping; // Repeat the texture horizontally
        seaTexture.wrapT = THREE.RepeatWrapping; // Repeat the texture vertically
        seaTexture.repeat.set(4, 4); // Set how many times to repeat the texture
    
        // Create the material with the texture
        const seaMaterial = new THREE.MeshBasicMaterial({ map: seaTexture, side: THREE.DoubleSide });
    
        this.sea = new THREE.Mesh(seaGeometry, seaMaterial); // Create the sea mesh
        this.sea.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
        this.scene.add(this.sea); // Add the sea to the scene
    
        // Initialize the sea movement parameters
        this.seaSpeedZ = 0.5; // Speed for the sea movement
    }    

    _updateSea() {
        // Move the sea to simulate movement
        this.sea.position.z += this.seaSpeedZ;
    
        // Reset position to create a continuous movement effect
        if (this.sea.position.z > 50) { // Adjust based on your needs
            this.sea.position.z = 0; // Reset to original position
        }
    }

    _initializeScene(replay) {
        if (!replay) {

            this.objectsParent = new THREE.Group();
            this.scene.add(this.objectsParent);

            for (let i = 0; i < 10; i++)
                this._spawnObstacle();
            for (let i = 0; i < 10; i++)
                this._spawnBonus();

            this.camera.rotateX(-20 * Math.PI / 180);
            this.camera.position.set(0, 1.5, 3);
            this.camera.lookAt(0, 0, 0);
        } else {
            // Replay logic
            this.objectsParent.traverse((item) => {
                if (item instanceof THREE.Mesh) {
                    if (item.userData.type === 'obstacle') {
                        this._setupObstacle(item);
                    } else {
                        item.userData.price = this._setupBonus(item);
                    }
                } else {
                    item.position.set(0, 0, 0);
                }
            });
        }
    }

    _spawnObstacle() {
        const obj = new THREE.Mesh(
            this.OBSTACLE_PREFAB,
            this.OBSTACLE_MATERIAL
        );
        this._setupObstacle(obj);
        obj.userData = { type: 'obstacle' };
        this.objectsParent.add(obj);
    }

    _setupObstacle(obj, refXpos = 0, refZpos = 0) {
        obj.scale.set(
            this._randomFloat(0.5, 2),
            this._randomFloat(0.5, 2),
            this._randomFloat(0.5, 2),
        );

        obj.position.set(
            refXpos + this._randomFloat(-30, 30), // Random X position
            obj.scale.y * 0.5,                   // Y position based on scale
            refZpos - 100 - this._randomFloat(0, 100) // Z position ahead of the ship
        );
    }


    _spawnBonus() {
        const obj = new THREE.Mesh(
            this.BONUS_PREFAB,
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        const price = this._setupBonus(obj);
        obj.userData = { type: 'bonus', price };
        this.objectsParent.add(obj);
    }


    _setupBonus(obj, refXpos = 0, refZpos = 0) {
        const price = this._randomInt(5, 20);
        const ratio = price / 20;

        const size = ratio * 0.5;
        obj.scale.set(size, size, size);

        const hue = 0.5 + 0.5 * ratio;
        obj.material.color.setHSL(hue, 1, 0.5);

        obj.position.set(
            refXpos + this._randomFloat(-30, 30),
            obj.scale.y * 0.5,
            refZpos - 100 - this._randomFloat(0, 100),
        );

        return price;
    }

    _shakeCamera(initialPosition, remainingShakes = 3) {
        const $this = this;

        const startPosition = {
            x: initialPosition.x,
            y: initialPosition.y,
            z: initialPosition.z
        };

        const startOffset = { x: 0, y: 0 };
        const endOffset = {
            x: this._randomFloat(-0.25, 0.25),
            y: this._randomFloat(-0.25, 0.25),
        };

        this.cameraLerp = new Lerp(startOffset, endOffset, this._randomFloat(0.1, 0.22))
            .onUpdate((value) => {
                $this.camera.position.set(
                    startPosition.x + value.x,
                    startPosition.y + value.y,
                    startPosition.z
                )
            })
            .onFinish(() => {
                if (remainingShakes > 0)
                    $this._shakeCamera(initialPosition, remainingShakes - 1);
                else {
                    $this.cameraLerp = null;
                    $this.camera.position.set(
                        initialPosition.x,
                        initialPosition.y,
                        initialPosition.z
                    );
                }
            });
    }

    _createScorePopup(score) {
        const scorePopup = document.createElement('div');
        scorePopup.innerText = `+${score}`;
        scorePopup.className = 'score-popup';
        document.body.appendChild(scorePopup);
        setTimeout(() => {
            scorePopup.remove();
        }, 1000);
    }

    _randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    _randomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}