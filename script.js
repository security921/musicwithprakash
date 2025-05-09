let currentSong = new Audio();
const play = document.querySelector(".play");
let songs = [];
let currFolder;

// Format seconds to MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    songs = [];
    try {
        let response = await fetch(`http://192.168.8.80:3000/${folder}/`);
        if (!response.ok) throw new Error("Network response was not ok");

        let html = await response.text();
        let div = document.createElement("div");
        div.innerHTML = html;

        let as = div.getElementsByTagName("a");
        for (let element of as) {
            if (element.href.endsWith(".mp3")) {
                let trackName = element.href.split(`${folder}/`)[1];
                songs.push(decodeURIComponent(trackName));
            }
        }
    } catch (error) {
        console.error("Error fetching songs:", error);
    }

    const songUL = document.querySelector(".songsList ul");
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `
            <li>
                <img src="playicon/music.svg" alt="">
                <div class="info">
                    <div>${song}</div>
                    <div>mr.prkash</div>
                </div>
                <img class="invert" src="playicon/list-play.svg" alt="">
            </li>`;
    }

    document.querySelectorAll(".songsList li").forEach(li => {
        li.addEventListener("click", () => {
            const track = li.querySelector(".info div").innerText.trim();
            playMusic(track);
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `http://192.168.8.80:3000/${currFolder}/${track}`;
    if (!pause) {
        currentSong.play();
        play.src = "playicon/pause.svg";
    }

    document.querySelector(".songInfo").innerHTML = track.replace(".mp3", "");
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00";

    document.querySelectorAll(".songsList li").forEach(li => {
        const name = li.querySelector(".info div").innerText.trim();
        li.classList.toggle("active", name === track);
    });
};

async function display() {
    let a = await fetch("http://192.168.8.80:3000/songs/");
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardcontainer = document.querySelector(".cardcontainer");

    for (let e of anchors) {
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-2)[0];
            try {
                let res = await fetch(`http://192.168.8.80:3000/songs/${folder}/info.json`);
                let data = await res.json();
                cardcontainer.innerHTML += `
                <div data-folder="songs/${folder}" class="card">
                    <div class="homeburgur">
                        <div style="position: relative; width: 80px; height: 80px;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 96 960 960" width="80" height="80"
                                fill="green" style="position: absolute; top: 0; left: 0;">
                                <path d="M480 936q-75 0-141.5-28.5T222 830q-49-49-77.5-115.5T116 573q0-75 28.5-141.5T222 316q49-49 115.5-77.5T480 210q75 0 141.5 28.5T738 316q49 49 77.5 115.5T844 573q0 75-28.5 141.5T738 830q-49 49-115.5 77.5T480 936Z"/>
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="35" height="35"
                                fill="black" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                    <img src="/songs/${folder}/cover.jpeg" alt="">
                    <h2>${data.title}</h2>
                    <p>${data.description}</p>
                </div>`;
            } catch (err) {
                console.warn("Error loading info.json for folder:", folder);
            }
        }
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const folder = card.dataset.folder;
            await getSongs(folder);
            if (songs.length) playMusic(songs[0]);
        });
    });
}

async function main() {
    await getSongs("songs/favsongs");
    if (songs.length) playMusic(songs[0], true);

    await display();

    // Play/pause toggle
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "playicon/pause.svg";
        } else {
            currentSong.pause();
            play.src = "playicon/play.svg";
        }
    });

    // Song time update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songTime").innerText = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar click
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        currentSong.currentTime = (currentSong.duration * percent) / 100;
        document.querySelector(".circle").style.left = percent + "%";
    });

    // Song ended
    currentSong.addEventListener("ended", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if ((index + 1) < songs.length) playMusic(songs[index + 1]);
    });

    // Navigation buttons
    document.querySelector(".previous").addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if ((index - 1) >= 0) playMusic(songs[index - 1]);
    });

    document.querySelector(".next").addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if ((index + 1) < songs.length) playMusic(songs[index + 1]);
    });

    // Hamburger menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    // Volume control
    document.querySelector(".range input").addEventListener("input", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    // Mute toggle
    document.querySelector(".volup").addEventListener("click", e => {
        const volIcon = e.target;
        if (volIcon.src.includes("volum.svg")) {
            volIcon.src = volIcon.src.replace("volum.svg", "no-sound.svg");
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            volIcon.src = volIcon.src.replace("no-sound.svg", "volum.svg");
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
