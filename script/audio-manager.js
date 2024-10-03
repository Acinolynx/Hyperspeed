var soundAudio;

function setupAudio() {

    // background music
    const musicAudio = new Howl({
        src: ['./assets/music.mp3'],
        autoplay: true,
        loop: true,
    });

    const musicId = musicAudio.play();
    musicAudio.fade(0, 1, 2000, musicId);

    // sound effects
    soundAudio = new Howl({
        src: ['./assets/collect-coin.mp3'],
        volume: 0.5,
    });
}