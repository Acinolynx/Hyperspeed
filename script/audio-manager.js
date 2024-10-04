var soundAudio;

function setupAudio() {

    // background music
    const musicAudio = new Howl({
        src: ['./assets/audio/music.mp3'],
        autoplay: true,
        loop: true,
        volume: 0.001
    });

    const musicId = musicAudio.play();
    musicAudio.volume(0.001, musicId);
    musicAudio.fade(0.001, 1, 2000, musicId);

    // sound effects
    soundAudio = new Howl({
        src: ['./assets/audio/collect-coin.mp3'],
    });

    soundHit = new Howl({
        src: ['./assets/audio/hit.mp3'],
        volume: 0.1
    });
}