class game {

    constructor(scene, camera) {
        this._initializeScene(scene, camera);

        document.addEventListener('keydown', this._keydown.bind(this));
        document.addEventListener('keyup', this._keyup.bind(this));
    }

    update() {

        this._updateGrid();
        this._checkCollisions();
        this._updateInfoPanel();
    }

    _keydown(event) {

    }

    _keyup() {

    }

    _updateGrid() {

    }

    _checkCollisions() {

    }

    _updateInfoPanel() {

    }

    _gameOver() {

    }

    _initializeScene(scene, camera) {
        const shipBody = new THREE.Mesh(
            new THREE.TetrahedronBufferGeometry(0.4, 0),
            new THREE.MeshBasicMaterial({color: 0xbbccdd}),
        );

        shipBody.rotateX(45 * Math.PI / 180); // Fixed rotation
        shipBody.rotateY(45 * Math.PI / 180); // Fixed rotation

        this.ship = new THREE.Group();
        this.ship.add(shipBody);

        scene.add(this.ship);

        camera.rotateX(-20 * Math.PI / 180);
        camera.position.set(0, 1.5, 2); // Ensure the camera position is suitable

        const reactorSocketGeometry = new THREE.CylinderBufferGeometry(0.08, 0.08, 0.1, 16);  
        const reactorSocketMaterial = new THREE.MeshBasicMaterial({color: 0x99aacc});
        const reactorSocket1 = new THREE.Mesh(reactorSocketGeometry, reactorSocketMaterial);
        const reactorSocket2 = new THREE.Mesh(reactorSocketGeometry, reactorSocketMaterial);
        const reactorSocket3 = new THREE.Mesh(reactorSocketGeometry, reactorSocketMaterial);

        this.ship.add(reactorSocket1);
        this.ship.add(reactorSocket2);
        this.ship.add(reactorSocket3);
        reactorSocket1.rotateX(90 * Math.PI / 180);
        reactorSocket1.position.set(-0.15, 0, 0.1);
        reactorSocket2.rotateX(90 * Math.PI / 180);
        reactorSocket2.position.set(0.15, 0, 0.1);
        reactorSocket3.rotateX(90 * Math.PI / 180);
        reactorSocket3.position.set(0., -0.15, 0.1);

        const reactorLightGeometry = new THREE.CylinderBufferGeometry(0.055, 0.055, 0.1, 16);
        const reactorLightMaterial = new THREE.MeshBasicMaterial({color: 0xaadeff});
        const reactorLight1 = new THREE.Mesh(reactorLightGeometry, reactorLightMaterial);
        const reactorLight2 = new THREE.Mesh(reactorLightGeometry, reactorLightMaterial);
        const reactorLight3 = new THREE.Mesh(reactorLightGeometry, reactorLightMaterial);

        this.ship.add(reactorLight1);
        this.ship.add(reactorLight2);
        this.ship.add(reactorLight3);
        reactorLight1.rotateX(90 * Math.PI / 180);
        reactorLight1.position.set(-0.15, 0, 0.11);
        reactorLight2.rotateX(90 * Math.PI / 180);
        reactorLight2.position.set(0.15, 0, 0.11);
        reactorLight3.rotateX(90 * Math.PI / 180);
        reactorLight3.position.set(0., -0.15, 0.11);



    }

}