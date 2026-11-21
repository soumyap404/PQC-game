/* ============================================================================
   QUANTUM ZERO: The Last Encryption — Game Engine & PQC Curriculum
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'quantumZeroSave_v2';

  function onClick(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  function formatHearts(lives) {
    const count = Math.max(0, Math.min(3, Number(lives) || 0));
    return count > 0 ? '❤️'.repeat(count) : '💔';
  }

  // --- Sound & Synth Music Engine (Web Audio API, no external files required) ---
  const AudioEngine = (() => {
    let ctx = null;
    let sfxEnabled = true;
    let musicEnabled = true;
    let musicTimer = null;
    let stepIndex = 0;

    const bassNotes = [110, 110, 130.81, 98, 87.31, 87.31, 98, 110];
    const arpNotes = [440, 523.25, 659.25, 783.99, 659.25, 523.25, 392, 493.88];

    function ensureCtx() {
      try {
        if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
          const AC = window.AudioContext || window.webkitAudioContext;
          ctx = new AC();
        }
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      } catch {
        // Audio unsupported
      }
    }

    function playTone(freq, duration, type, gainVal, filterCutoff = 1800) {
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterCutoff, now);

        gain.gain.setValueAtTime(gainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      } catch {
        // Ignore tone errors
      }
    }

    function musicTick() {
      if (!musicEnabled) return;
      ensureCtx();
      if (!ctx || ctx.state !== 'running') return;

      const bass = bassNotes[stepIndex % bassNotes.length];
      const arp = arpNotes[stepIndex % arpNotes.length];

      playTone(bass, 0.22, 'sawtooth', 0.032, 520);
      if (stepIndex % 2 === 0) {
        playTone(arp, 0.14, 'triangle', 0.02, 2400);
      }
      stepIndex += 1;
    }

    function startMusicLoop() {
      if (musicTimer !== null) return;
      musicTimer = setInterval(musicTick, 230);
    }

    function stopMusicLoop() {
      if (musicTimer !== null) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    }

    function beep(freq = 440, duration = 0.12, type = 'sine', gainVal = 0.08) {
      if (!sfxEnabled) return;
      ensureCtx();
      if (!ctx) return;
      playTone(freq, duration, type, gainVal, 4200);
    }

    return {
      setSfxEnabled(val) { sfxEnabled = Boolean(val); },
      isSfxEnabled() { return sfxEnabled; },
      setMusicEnabled(val) {
        musicEnabled = Boolean(val);
        if (musicEnabled) {
          ensureCtx();
          startMusicLoop();
        } else {
          stopMusicLoop();
        }
      },
      isMusicEnabled() { return musicEnabled; },
      unlockAudio() {
        ensureCtx();
        if (musicEnabled) startMusicLoop();
      },
      pickup() { beep(760, 0.11, 'triangle', 0.09); },
      shield() { beep(320, 0.18, 'sawtooth', 0.07); },
      hit() { beep(140, 0.25, 'sawtooth', 0.12); },
      win() {
        beep(523.25, 0.12, 'triangle', 0.09);
        setTimeout(() => beep(659.25, 0.12, 'triangle', 0.09), 110);
        setTimeout(() => beep(783.99, 0.2, 'triangle', 0.1), 220);
      }
    };
  })();

  // --- Mission & Cryptography Data (4 Missions; Former Mission 03 Removed) ---
  const MISSIONS = [
    {
      id: 1,
      code: 'MISSION 01',
      title: 'The Digital City',
      mode: 'tutorial',
      duration: 45,
      targetCount: 4,
      unlockLabel: 'NETWORK ACCESS UNLOCKED',
      summary: 'Route encrypted key packets between Terminal A and Terminal B while avoiding red interference.',
      objective: 'Deliver 4 encrypted packets between terminals',
      guideTip: 'Touch TERM-A (cyan) to grab a key, then reach TERM-B to deliver it while dodging red projectiles.',
      lesson: 'Data is valuable, but protected data is powerful. Encryption transforms readable information into a secret code, helping keep it safe from unauthorized access as it travels across the digital world.',
      quiz: {
        question: 'What is the main purpose of encryption when sending data from Terminal A to Terminal B?',
        options: [
          'To make data travel faster',
          'To protect data from unauthorized access',
          'To delete the original data'
        ],
        correctIndex: 1,
        
      }
    },
    {
      id: 2,
      code: 'MISSION 02',
      title: 'The Quantum Threat',
      mode: 'arcade',
      duration: 40,
      targetCount: 6,
      unlockLabel: 'THREAT INTELLIGENCE UNLOCKED',
      summary: 'Survive Q-CORE attack waves, use your Space shield, and collect secure data packets.',
      objective: 'Collect 6 packets & survive the timer',
      guideTip: 'Collect green data packets (+10 pts) and tap Space to block incoming red projectiles.',
      lesson: "The future of cybersecurity depends on preparing today. Powerful quantum computers could threaten traditional encryption like RSA and ECC, but Post-Quantum Cryptography is building a stronger shield for tomorrow’s digital world.",
      quiz: {
        question: 'Why do we need Post-Quantum Cryptography (PQC)?',
        options: [
          "Future powerful quantum computers could break RSA and ECC.",
          "Today's quantum computers have already broken all encryption.",
          'Quantum computers make AES-256 useless.'
        ],
        correctIndex: 0
        
      }
    },
    {
      id: 3,
      code: 'MISSION 03',
      title: 'Rebuild the Defense',
      mode: 'strategy',
      duration: 90,
      targetCount: 3,
      unlockLabel: 'CITYWIDE DEFENSE UNLOCKED',
      summary: 'Assign post-quantum algorithms to the Hospital link, Bank settlement, and Identity server.',
      objective: 'Match PQC algorithms to all 3 city systems',
      guideTip: 'Select ML-KEM for key establishment, ML-DSA for fast signatures, and SLH-DSA for hash-based signatures.',
      lesson: 'Different cryptographic tasks require different algorithms. ML-KEM (standardized from CRYSTALS-Kyber) is designed for post-quantum key establishment, while ML-DSA (from CRYSTALS-Dilithium) and SLH-DSA (hash-based, from SPHINCS+) provide post-quantum digital signatures.',
      quiz: {
        question: 'Which NIST post-quantum algorithm is specifically designed for key establishment?',
        options: [
          'ML-KEM',
          'SLH-DSA',
          'RSA-1024'
        ],
        correctIndex: 0,
        explanation: 'ML-KEM is standardized for post-quantum key establishment (encapsulation), whereas ML-DSA and SLH-DSA are standardized for digital signatures.'
      }
    },
    {
      id: 4,
      code: 'MISSION 04',
      title: 'The Last Encryption',
      mode: 'boss',
      duration: 60,
      targetCount: 8,
      unlockLabel: 'DIGITAL GUARDIAN RANK ACHIEVED',
      summary: 'Face Q-CORE! Collect green PQC packets to fire purification pulses and defeat the boss.',
      objective: 'Collect 8 PQC packets to neutralize Q-CORE',
      guideTip: 'Weave around Q-CORE shots, use your Space shield in tight spots, and gather 8 green PQC packets.',
      lesson: 'Resilient cyber defense combines threat awareness, post-quantum key establishment (ML-KEM), post-quantum signatures (ML-DSA / SLH-DSA), and strong symmetric protection. Defense in depth keeps critical infrastructure safe as technology evolves.',
      quiz: {
        question: 'Which combination reflects sound post-quantum defense planning?',
        options: [
          'Using ML-KEM for key establishment and ML-DSA or SLH-DSA for digital signatures',
          'Disabling encryption whenever network traffic gets heavy',
          'Relying solely on unpatched legacy RSA keys until 2050'
        ],
        correctIndex: 0,
       
      }
    }
  ];

  function getRankForScore(score) {
    if (score >= 1150) return 'DIGITAL GUARDIAN';
    if (score >= 750) return 'PQC ARCHITECT';
    if (score >= 350) return 'CIPHER ANALYST';
    return 'CADET';
  }

  // --- Save State ---
  function defaultSave() {
    return {
      highestUnlocked: 1,
      completedMissions: [],
      score: 0,
      soundEnabled: true,
      musicEnabled: true
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      return {
        highestUnlocked: Math.min(MISSIONS.length, Number(parsed.highestUnlocked) || 1),
        completedMissions: Array.isArray(parsed.completedMissions)
          ? parsed.completedMissions.filter(id => id >= 1 && id <= MISSIONS.length)
          : [],
        score: Number(parsed.score) || 0,
        soundEnabled: parsed.soundEnabled !== undefined ? Boolean(parsed.soundEnabled) : true,
        musicEnabled: parsed.musicEnabled !== undefined ? Boolean(parsed.musicEnabled) : true
      };
    } catch {
      return defaultSave();
    }
  }

  let saveData = loadSave();

  function persistSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch {
      // Ignore storage errors
    }
  }

  // --- DOM References ---
  const screens = {
    menu: document.getElementById('screen-menu'),
    map: document.getElementById('screen-map'),
    arena: document.getElementById('screen-arena'),
    quiz: document.getElementById('screen-quiz'),
    victory: document.getElementById('screen-victory')
  };

  const globalScoreEl = document.getElementById('globalScore');
  const globalRankEl = document.getElementById('globalRank');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const missionMapGrid = document.getElementById('missionMapGrid');
  const cityIntegrityText = document.getElementById('cityIntegrityText');

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const puzzleOverlay = document.getElementById('puzzleOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const arenaInstructionsBox = document.getElementById('arenaInstructionsBox');

  // --- Navigation ---
  function showScreen(name) {
    Object.values(screens).forEach(s => {
      if (s) s.classList.remove('active');
    });
    if (screens[name]) {
      screens[name].classList.add('active');
    }
    updateTopHud();
  }

  function updateTopHud() {
    if (globalScoreEl) globalScoreEl.textContent = saveData.score;
    if (globalRankEl) globalRankEl.textContent = getRankForScore(saveData.score);
    if (musicToggleBtn) musicToggleBtn.textContent = AudioEngine.isMusicEnabled() ? 'MUSIC ON' : 'MUSIC OFF';
    if (soundToggleBtn) soundToggleBtn.textContent = AudioEngine.isSfxEnabled() ? 'SFX ON' : 'MUTED';
    const integrity = Math.round((saveData.completedMissions.length / MISSIONS.length) * 100);
    if (cityIntegrityText) cityIntegrityText.textContent = `${integrity}%`;
  }

  // --- Active Mission Session State ---
  let session = null;
  let animFrameId = null;
  let lastFrameTime = 0;

  const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    shield: false
  };

  function resetKeys() {
    keys.up = keys.down = keys.left = keys.right = keys.shield = false;
  }

  function startMission(missionId) {
    const mission = MISSIONS.find(m => m.id === missionId);
    if (!mission || !canvas || !ctx) return;

    AudioEngine.unlockAudio();
    resetKeys();
    if (puzzleOverlay) {
      puzzleOverlay.classList.add('hidden');
      puzzleOverlay.innerHTML = '';
    }
    if (pauseOverlay) pauseOverlay.classList.add('hidden');
    if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
    if (arenaInstructionsBox) arenaInstructionsBox.classList.remove('hidden');

    session = {
      mission,
      lives: 3,
      tookDamage: false,
      missionScore: 0,
      collected: 0,
      timeLeft: mission.duration,
      paused: false,
      ended: false,
      quizCorrectCount: 0,
      player: {
        x: 160,
        y: canvas.height / 2,
        r: 16,
        speed: 250,
        shieldTimer: 0,
        shieldCooldown: 0,
        invulnTimer: 0,
        carryingKey: false
      },
      terminals: {
        a: { x: 130, y: 140, r: 28, label: 'TERM-A' },
        b: { x: 770, y: 360, r: 28, label: 'TERM-B' }
      },
      packets: [],
      projectiles: [],
      particles: [],
      boss: {
        x: 740,
        y: 250,
        r: 44,
        hp: mission.targetCount,
        maxHp: mission.targetCount,
        fireTimer: 1.4,
        dirY: 1
      },
      spawnTimer: 1.1
    };

    const titleEl = document.getElementById('hudMissionTitle');
    const objEl = document.getElementById('hudObjective');
    const tipEl = document.getElementById('arenaModeTip');
    if (titleEl) titleEl.textContent = `${mission.code}: ${mission.title.toUpperCase()}`;
    if (objEl) objEl.textContent = mission.objective;
    if (tipEl) tipEl.textContent = mission.guideTip;

    if (mission.mode === 'tutorial' || mission.mode === 'arcade' || mission.mode === 'boss') {
      seedPackets();
    } else if (mission.mode === 'strategy') {
      setupStrategyPuzzle();
    }

    showScreen('arena');
    syncArenaHud();

    cancelAnimationFrame(animFrameId);
    lastFrameTime = performance.now();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function seedPackets() {
    session.packets = [];
    for (let i = 0; i < 3; i++) {
      spawnPacket();
    }
  }

  function spawnPacket() {
    if (!session || !canvas) return;
    const margin = 70;
    session.packets.push({
      x: margin + Math.random() * (canvas.width - margin * 2),
      y: margin + Math.random() * (canvas.height - margin * 2),
      r: 11,
      pulse: Math.random() * Math.PI * 2
    });
  }

  function spawnProjectile(fromBoss = false) {
    if (!session || !canvas) return;
    const p = session.player;
    let startX, startY, speed;

    if (fromBoss) {
      startX = session.boss.x - session.boss.r;
      startY = session.boss.y + (Math.random() - 0.5) * 60;
      speed = 215;
    } else {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { startX = Math.random() * canvas.width; startY = -10; }
      else if (edge === 1) { startX = canvas.width + 10; startY = Math.random() * canvas.height; }
      else if (edge === 2) { startX = Math.random() * canvas.width; startY = canvas.height + 10; }
      else { startX = -10; startY = Math.random() * canvas.height; }
      speed = session.mission.mode === 'tutorial' ? 125 : 185;
    }

    const angle = Math.atan2(p.y - startY, p.x - startX);
    session.projectiles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 8
    });
  }

  function addParticles(x, y, color, count = 12) {
    if (!session) return;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 40 + Math.random() * 110;
      session.particles.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.45 + Math.random() * 0.25,
        color
      });
    }
  }

  function syncArenaHud() {
    if (!session) return;
    const livesEl = document.getElementById('hudLives');
    const scoreEl = document.getElementById('hudScore');
    const progEl = document.getElementById('hudProgress');
    const timerEl = document.getElementById('hudTimer');

    if (livesEl) livesEl.textContent = formatHearts(session.lives);
    if (scoreEl) scoreEl.textContent = String(session.missionScore);
    const pct = Math.min(100, Math.round((session.collected / session.mission.targetCount) * 100));
    if (progEl) progEl.textContent = `${pct}% (${session.collected}/${session.mission.targetCount})`;
    const secs = Math.max(0, Math.ceil(session.timeLeft));
    const mins = String(Math.floor(secs / 60)).padStart(2, '0');
    const rem = String(secs % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${mins}:${rem}`;
  }

  // --- Strategy & PQC Algorithm Matching ---
  function setupStrategyPuzzle() {
    if (!puzzleOverlay) return;
    puzzleOverlay.classList.remove('hidden');
    puzzleOverlay.innerHTML = `
      <h3>REBUILD THE DEFENSE — ALGORITHM DEPLOYMENT</h3>
      <p>Assign the right NIST post-quantum standard to each city system:</p>
      <div class="strategy-cards">
        <div class="system-slot">
          <h4>HOSPITAL TELEMETRY LINK</h4>
          <p>Needs encrypted session keys shared securely over the network.</p>
          <select id="sel-hospital">
            <option value="">-- Choose PQC Algorithm --</option>
            <option value="ML-KEM">ML-KEM (Key Establishment)</option>
            <option value="ML-DSA">ML-DSA (Lattice Signatures)</option>
            <option value="SLH-DSA">SLH-DSA (Hash Signatures)</option>
          </select>
        </div>
        <div class="system-slot">
          <h4>BANK TRANSACTION SIGNER</h4>
          <p>Needs fast post-quantum digital signatures to verify payment orders.</p>
          <select id="sel-bank">
            <option value="">-- Choose PQC Algorithm --</option>
            <option value="ML-KEM">ML-KEM (Key Establishment)</option>
            <option value="ML-DSA">ML-DSA (Lattice Signatures)</option>
            <option value="SLH-DSA">SLH-DSA (Hash Signatures)</option>
          </select>
        </div>
        <div class="system-slot">
          <h4>ROOT IDENTITY AUTHORITY</h4>
          <p>Conservative long-term signature anchor backed by hash security.</p>
          <select id="sel-identity">
            <option value="">-- Choose PQC Algorithm --</option>
            <option value="ML-KEM">ML-KEM (Key Establishment)</option>
            <option value="ML-DSA">ML-DSA (Lattice Signatures)</option>
            <option value="SLH-DSA">SLH-DSA (Hash Signatures)</option>
          </select>
        </div>
      </div>
      <div class="overlay-buttons">
        <button id="deployDefenseBtn" class="btn btn-primary btn-small" type="button">DEPLOY DEFENSES</button>
      </div>
      <p id="strategyMsg" style="margin-top:10px;color:#00f0ff;"></p>
    `;

    onClick('deployDefenseBtn', () => {
      const h = document.getElementById('sel-hospital')?.value || '';
      const b = document.getElementById('sel-bank')?.value || '';
      const id = document.getElementById('sel-identity')?.value || '';
      const msgEl = document.getElementById('strategyMsg');

      const checks = [h === 'ML-KEM', b === 'ML-DSA', id === 'SLH-DSA'];
      const rightCount = checks.filter(Boolean).length;

      if (rightCount === 3) {
        AudioEngine.win();
        session.collected = 3;
        session.missionScore += 180;
        syncArenaHud();
        completeGameplayPhase();
      } else {
        AudioEngine.hit();
        session.lives -= 1;
        session.tookDamage = true;
        syncArenaHud();
        if (session.lives <= 0) {
          triggerGameOver('Critical infrastructure remained exposed.');
        } else if (msgEl) {
          msgEl.textContent = `${rightCount}/3 matched. Tip: ML-KEM establishes keys; ML-DSA and SLH-DSA sign data.`;
        }
      }
    });
  }

  // --- Main Loop & Action Modes ---
  function gameLoop(now) {
    if (!session || session.ended) return;
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (!session.paused) {
      updateSession(dt);
      drawArena();
    }

    animFrameId = requestAnimationFrame(gameLoop);
  }

  function updateSession(dt) {
    const mode = session.mission.mode;
    if (mode === 'strategy') return;

    session.timeLeft -= dt;
    if (session.timeLeft <= 0) {
      session.timeLeft = 0;
      triggerGameOver('Time ran out before the mission objective was completed.');
      return;
    }

    const p = session.player;
    if (p.shieldTimer > 0) p.shieldTimer = Math.max(0, p.shieldTimer - dt);
    if (p.shieldCooldown > 0) p.shieldCooldown = Math.max(0, p.shieldCooldown - dt);
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);

    if (keys.shield && p.shieldCooldown <= 0 && p.shieldTimer <= 0) {
      p.shieldTimer = 1.3;
      p.shieldCooldown = 2.8;
      AudioEngine.shield();
    }

    let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.SQRT2;
      dx *= inv;
      dy *= inv;
    }

    p.x = Math.max(p.r + 8, Math.min(canvas.width - p.r - 8, p.x + dx * p.speed * dt));
    p.y = Math.max(p.r + 8, Math.min(canvas.height - p.r - 8, p.y + dy * p.speed * dt));

    session.spawnTimer -= dt;
    if (session.spawnTimer <= 0) {
      spawnProjectile(false);
      session.spawnTimer = mode === 'tutorial' ? 2.1 : 1.25;
    }

    if (mode === 'boss') {
      const b = session.boss;
      b.y += b.dirY * 95 * dt;
      if (b.y < 80) { b.y = 80; b.dirY = 1; }
      if (b.y > canvas.height - 80) { b.y = canvas.height - 80; b.dirY = -1; }

      b.fireTimer -= dt;
      if (b.fireTimer <= 0) {
        spawnProjectile(true);
        b.fireTimer = 1.65;
      }
    }

    if (mode === 'tutorial') {
      const tA = session.terminals.a;
      const tB = session.terminals.b;
      if (!p.carryingKey && Math.hypot(p.x - tA.x, p.y - tA.y) < p.r + tA.r) {
        p.carryingKey = true;
        AudioEngine.pickup();
        addParticles(tA.x, tA.y, '#00f0ff', 10);
      } else if (p.carryingKey && Math.hypot(p.x - tB.x, p.y - tB.y) < p.r + tB.r) {
        p.carryingKey = false;
        session.collected += 1;
        session.missionScore += 50;
        AudioEngine.win();
        addParticles(tB.x, tB.y, '#10f9a0', 16);
        if (session.collected >= session.mission.targetCount) {
          completeGameplayPhase();
          return;
        }
      }
    }

    for (let i = session.packets.length - 1; i >= 0; i--) {
      const pkt = session.packets[i];
      pkt.pulse += dt * 4;
      if (Math.hypot(p.x - pkt.x, p.y - pkt.y) < p.r + pkt.r) {
        session.packets.splice(i, 1);
        session.missionScore += 10;
        AudioEngine.pickup();
        addParticles(pkt.x, pkt.y, '#10f9a0', 10);

        if (mode === 'arcade' || mode === 'boss') {
          session.collected += 1;
          if (session.collected >= session.mission.targetCount) {
            completeGameplayPhase();
            return;
          }
        }
        spawnPacket();
      }
    }

    for (let i = session.projectiles.length - 1; i >= 0; i--) {
      const pr = session.projectiles[i];
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      if (pr.x < -30 || pr.x > canvas.width + 30 || pr.y < -30 || pr.y > canvas.height + 30) {
        session.projectiles.splice(i, 1);
        continue;
      }

      const dist = Math.hypot(p.x - pr.x, p.y - pr.y);
      if (dist < p.r + pr.r) {
        session.projectiles.splice(i, 1);
        if (p.shieldTimer > 0) {
          addParticles(pr.x, pr.y, '#00f0ff', 8);
        } else if (p.invulnTimer <= 0) {
          session.lives -= 1;
          session.tookDamage = true;
          p.invulnTimer = 1.1;
          AudioEngine.hit();
          addParticles(p.x, p.y, '#ff3b5c', 16);
          if (session.lives <= 0) {
            triggerGameOver('Your shield drone sustained critical damage.');
            return;
          }
        }
      }
    }

    for (let i = session.particles.length - 1; i >= 0; i--) {
      const pt = session.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) session.particles.splice(i, 1);
    }

    syncArenaHud();
  }

  function drawArena() {
    if (!ctx || !canvas || !session) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    if (session.mission.mode === 'tutorial') {
      const { a, b } = session.terminals;
      [a, b].forEach((term, idx) => {
        const activeTarget = (idx === 0 && !session.player.carryingKey) || (idx === 1 && session.player.carryingKey);
        ctx.beginPath();
        ctx.arc(term.x, term.y, term.r, 0, Math.PI * 2);
        ctx.fillStyle = activeTarget ? 'rgba(0, 240, 255, 0.22)' : 'rgba(157, 78, 221, 0.16)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = activeTarget ? '#00f0ff' : '#9d4edd';
        ctx.stroke();

        ctx.fillStyle = '#eef4ff';
        ctx.font = 'bold 11px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(term.label, term.x, term.y + 4);
      });
    }

    if (session.mission.mode === 'boss') {
      const b = session.boss;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 59, 92, 0.24)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ff3b5c';
      ctx.stroke();

      ctx.fillStyle = '#ff8fa3';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Q-CORE', b.x, b.y + 4);
    }

    session.packets.forEach(pkt => {
      const rad = pkt.r + Math.sin(pkt.pulse) * 2;
      ctx.beginPath();
      ctx.arc(pkt.x, pkt.y, rad, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 249, 160, 0.25)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#10f9a0';
      ctx.stroke();
    });

    session.projectiles.forEach(pr => {
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ff3b5c';
      ctx.fill();
    });

    const p = session.player;
    if (p.invulnTimer <= 0 || Math.floor(p.invulnTimer * 16) % 2 === 0) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.carryingKey ? '#10f9a0' : '#00f0ff';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }

    if (p.shieldTimer > 0) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#9d4edd';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    session.particles.forEach(pt => {
      ctx.globalAlpha = Math.max(0, pt.life * 1.6);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6);
    });
    ctx.globalAlpha = 1;
  }

  function triggerGameOver(reason) {
    if (!session || session.ended) return;
    session.ended = true;
    cancelAnimationFrame(animFrameId);
    const reasonEl = document.getElementById('gameOverReason');
    if (reasonEl) reasonEl.textContent = reason;
    if (gameOverOverlay) gameOverOverlay.classList.remove('hidden');
  }

  function completeGameplayPhase() {
    if (!session || session.ended) return;
    session.ended = true;
    cancelAnimationFrame(animFrameId);

    session.missionScore += 250;
    if (!session.tookDamage) {
      session.missionScore += 50;
    }

    openQuizScreen();
  }

  // --- Screen 4: Learning Terminal & Quiz ---
  function openQuizScreen() {
    const m = session.mission;
    const tagEl = document.getElementById('quizMissionTag');
    const lessonEl = document.getElementById('quizLessonText');
    const qEl = document.getElementById('quizQuestionText');
    const optionsEl = document.getElementById('quizOptions');
    const feedbackEl = document.getElementById('quizFeedback');

    if (tagEl) tagEl.textContent = `${m.code} · LEARNING TERMINAL`;
    if (lessonEl) lessonEl.textContent = m.lesson;
    if (qEl) qEl.textContent = m.quiz.question;
    if (!optionsEl || !feedbackEl) return;

    optionsEl.innerHTML = '';
    feedbackEl.classList.add('hidden');

    m.quiz.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option-btn';
      btn.textContent = optText;
      btn.addEventListener('click', () => {
        const allBtns = optionsEl.querySelectorAll('button');
        allBtns.forEach(b => (b.disabled = true));

        const isCorrect = idx === m.quiz.correctIndex;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');

        const verdictEl = document.getElementById('feedbackVerdict');
        const expEl = document.getElementById('feedbackExplanation');

        if (isCorrect) {
          session.quizCorrectCount = 1;
          session.missionScore += 100;
          AudioEngine.win();
          if (verdictEl) verdictEl.textContent = 'VERIFIED (+100 PTS)';
        } else {
          if (allBtns[m.quiz.correctIndex]) allBtns[m.quiz.correctIndex].classList.add('correct');
          AudioEngine.hit();
          if (verdictEl) verdictEl.textContent = 'REVIEW REQUIRED (0 PTS)';
        }

        if (expEl) expEl.textContent = m.quiz.explanation;
        feedbackEl.classList.remove('hidden');
      });
      optionsEl.appendChild(btn);
    });

    showScreen('quiz');
  }

  // --- Screen 5: Victory & Results ---
  function openVictoryScreen() {
    const m = session.mission;
    saveData.score += session.missionScore;
    if (!saveData.completedMissions.includes(m.id)) {
      saveData.completedMissions.push(m.id);
    }
    if (m.id < MISSIONS.length && saveData.highestUnlocked < m.id + 1) {
      saveData.highestUnlocked = m.id + 1;
    }
    persistSave();
    updateTopHud();

    const headingEl = document.getElementById('victoryHeading');
    const unlockEl = document.getElementById('victoryUnlockText');
    const scoreEl = document.getElementById('resScore');
    const livesEl = document.getElementById('resLives');
    const quizEl = document.getElementById('resQuizStatus');
    const rankEl = document.getElementById('resRank');

    if (headingEl) headingEl.textContent = `${m.code} COMPLETE`;
    if (unlockEl) unlockEl.textContent = m.unlockLabel;
    if (scoreEl) scoreEl.textContent = String(session.missionScore);
    if (livesEl) livesEl.textContent = formatHearts(session.lives);
    if (quizEl) quizEl.textContent = `${session.quizCorrectCount}/1`;
    if (rankEl) rankEl.textContent = getRankForScore(saveData.score);

    const isFinal = m.id === MISSIONS.length;
    const finalBox = document.getElementById('finalReportBox');
    const nextBtn = document.getElementById('nextMissionBtn');
    if (finalBox) finalBox.classList.toggle('hidden', !isFinal);
    if (nextBtn) nextBtn.classList.toggle('hidden', isFinal);

    showScreen('victory');
  }

  // --- Mission Map Renderer ---
  function renderMissionMap() {
    if (!missionMapGrid) return;
    missionMapGrid.innerHTML = '';
    MISSIONS.forEach(m => {
      const unlocked = m.id <= saveData.highestUnlocked;
      const completed = saveData.completedMissions.includes(m.id);

      const card = document.createElement('article');
      card.className = `mission-card ${unlocked ? 'unlocked' : 'locked'} ${completed ? 'completed' : ''}`;

      const statusText = completed ? 'SECURED' : unlocked ? 'AVAILABLE' : 'LOCKED';
      const statusClass = completed ? 'mission-status-done' : unlocked ? 'mission-status-open' : 'mission-status-locked';

      card.innerHTML = `
        <div>
          <div class="mission-top">
            <span>${m.code}</span>
            <span class="${statusClass}">${statusText}</span>
          </div>
          <h3>${m.title}</h3>
          <p>${m.summary}</p>
        </div>
        <div>
          <div class="mission-meta">Mode: ${m.mode.toUpperCase()}</div>
          <button type="button" class="btn btn-primary btn-small" style="margin-top:10px;width:100%;" ${unlocked ? '' : 'disabled'}>
            ${completed ? 'REPLAY MISSION' : unlocked ? 'LAUNCH MISSION' : 'LOCKED'}
          </button>
        </div>
      `;

      if (unlocked) {
        const launchBtn = card.querySelector('button');
        if (launchBtn) launchBtn.addEventListener('click', () => startMission(m.id));
      }
      missionMapGrid.appendChild(card);
    });
  }

  // --- Input Listeners ---
  window.addEventListener('pointerdown', () => {
    AudioEngine.unlockAudio();
  }, { once: true });

  window.addEventListener('keydown', e => {
    AudioEngine.unlockAudio();
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') keys.shield = true;

    if (e.code === 'Escape' && screens.arena?.classList.contains('active') && session && !session.ended) {
      togglePause();
    }
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space') keys.shield = false;
  });

  function togglePause() {
    if (!session || session.ended) return;
    session.paused = !session.paused;
    if (pauseOverlay) pauseOverlay.classList.toggle('hidden', !session.paused);
    if (!session.paused) {
      lastFrameTime = performance.now();
    }
  }

  // Touch controls
  document.querySelectorAll('.dpad .touch-btn').forEach(btn => {
    const dir = btn.dataset.dir;
    const setDir = val => { if (dir && dir in keys) keys[dir] = val; };
    btn.addEventListener('pointerdown', () => setDir(true));
    btn.addEventListener('pointerup', () => setDir(false));
    btn.addEventListener('pointerleave', () => setDir(false));
  });

  const touchShieldBtn = document.getElementById('touchShieldBtn');
  if (touchShieldBtn) {
    touchShieldBtn.addEventListener('pointerdown', () => { keys.shield = true; });
    touchShieldBtn.addEventListener('pointerup', () => { keys.shield = false; });
  }

  // UI Buttons
  onClick('brandHomeBtn', () => {
    cancelAnimationFrame(animFrameId);
    showScreen('menu');
  });

  onClick('playBtn', () => {
    AudioEngine.unlockAudio();
    renderMissionMap();
    showScreen('map');
  });

  onClick('continueBtn', () => {
    startMission(saveData.highestUnlocked);
  });

  onClick('howToPlayBtn', () => {
    const panel = document.getElementById('howToPlayPanel');
    if (panel) panel.classList.toggle('hidden');
  });

  onClick('closeHowToPlayBtn', () => {
    const panel = document.getElementById('howToPlayPanel');
    if (panel) panel.classList.add('hidden');
  });

  onClick('resetSaveBtn', () => {
    saveData = defaultSave();
    persistSave();
    updateTopHud();
    renderMissionMap();
  });

  onClick('backToMenuBtn', () => showScreen('menu'));

  onClick('musicToggleBtn', () => {
    AudioEngine.setMusicEnabled(!AudioEngine.isMusicEnabled());
    saveData.musicEnabled = AudioEngine.isMusicEnabled();
    persistSave();
    updateTopHud();
  });

  onClick('soundToggleBtn', () => {
    AudioEngine.setSfxEnabled(!AudioEngine.isSfxEnabled());
    saveData.soundEnabled = AudioEngine.isSfxEnabled();
    persistSave();
    updateTopHud();
  });

  onClick('toggleArenaGuideBtn', () => {
    if (arenaInstructionsBox) arenaInstructionsBox.classList.toggle('hidden');
  });

  onClick('pauseBtn', togglePause);
  onClick('resumeBtn', togglePause);

  onClick('restartFromPauseBtn', () => {
    if (session) startMission(session.mission.id);
  });

  onClick('retryMissionBtn', () => {
    if (session) startMission(session.mission.id);
  });

  onClick('quitMissionBtn', () => {
    cancelAnimationFrame(animFrameId);
    renderMissionMap();
    showScreen('map');
  });

  onClick('mapFromPauseBtn', () => {
    cancelAnimationFrame(animFrameId);
    renderMissionMap();
    showScreen('map');
  });

  onClick('mapFromGameOverBtn', () => {
    cancelAnimationFrame(animFrameId);
    renderMissionMap();
    showScreen('map');
  });

  onClick('proceedToVictoryBtn', openVictoryScreen);

  onClick('nextMissionBtn', () => {
    const nextId = (session?.mission?.id || 1) + 1;
    if (nextId <= MISSIONS.length) {
      startMission(nextId);
    } else {
      renderMissionMap();
      showScreen('map');
    }
  });

  onClick('victoryMapBtn', () => {
    renderMissionMap();
    showScreen('map');
  });

  // --- Boot ---
  AudioEngine.setSfxEnabled(saveData.soundEnabled);
  AudioEngine.setMusicEnabled(saveData.musicEnabled);
  updateTopHud();
  renderMissionMap();
});
