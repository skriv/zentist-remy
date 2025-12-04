/*
===================================================
   Remy Component Class (Fully English Comments)
===================================================
*/
class Remy {
  constructor(config = {}) {

    // Merge user config with defaults
    this.cfg = Object.assign({
      container: null,
      palette: {
        light: {
          followColor: "#617280",
          idleColor:   "#657C89",
          cycleColors: ["#155DFC","#E7000B","#19C37D","#FFB400","#9930FF"]
        },
        dark: {
          followColor: "#C9D3DD",
          idleColor:   "#4B5D70",
          cycleColors: ["#38BDF8","#FB7185","#4ADE80","#FACC15","#A855F7"]
        }
      },
      cycleInterval: 900,  // interval for color cycling
      deadZone: 40,        // zone where eyes do not move
      falloff: 160,        // eye tracking influence distance
      maxOffset: 1.5,      // max eye offset
      eyeHeight: 5         // full eye height
    }, config);

    this.mode = "follow";
    this.colorIndex = 0;
    this.theme = this._detectTheme();

    this._initDOM();
    this._applyBaseColor();
    this._startColorCycle();
    this._startBlink();
    this._enableTracking();
    this._setupThemeObserver();

    // Register instance globally so external theme toggles can update it
    if (!window.__remyInstances) window.__remyInstances = [];
    window.__remyInstances.push(this);
  }

  /* Detect theme: explicit data-theme takes priority,
     then system prefers-color-scheme. */
  _detectTheme(){
    const root = document.documentElement;
    const explicit = root.getAttribute("data-theme");
    if (explicit === "light" || explicit === "dark") return explicit;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  /* Return palette based on current theme */
  _getPalette(){
    return this.cfg.palette[this.theme] || this.cfg.palette.light;
  }

  /* Create SVG structure inside container */
  _initDOM(){
    const c = (typeof this.cfg.container === "string")
      ? document.querySelector(this.cfg.container)
      : this.cfg.container;

    this.wrapper = document.createElement("div");
    this.wrapper.className = "remy-wrapper";
    this.wrapper.innerHTML = `
      <svg viewBox="0 0 20 20">
        <circle class="remy-border" cx="10" cy="10" r="8"
          fill="none" stroke="#000" stroke-width="2"/>
        <g class="remy-eyes">
          <rect class="remy-eye" x="7"  y="7.5" width="2" height="5" rx="1" fill="#000"/>
          <rect class="remy-eye" x="11" y="7.5" width="2" height="5" rx="1" fill="#000"/>
        </g>
      </svg>`;
    c.appendChild(this.wrapper);

    this.svg = this.wrapper.querySelector("svg");
    this.border = this.wrapper.querySelector(".remy-border");
    this.leftEye  = this.wrapper.querySelectorAll(".remy-eye")[0];
    this.rightEye = this.wrapper.querySelectorAll(".remy-eye")[1];

    this.baseLeft  = { x:7,  y:7.5 };
    this.baseRight = { x:11, y:7.5 };
  }

  /* Sync eyes + border color (always together) */
  _syncColor(color){
    this.border.setAttribute("stroke", color);
    this.leftEye.setAttribute("fill", color);
    this.rightEye.setAttribute("fill", color);
  }

  /* Apply initial color based on mode + theme */
  _applyBaseColor(){
    const pal = this._getPalette();
    if (this.mode === "idle") this._syncColor(pal.idleColor);
    else this._syncColor(pal.followColor);
  }

  /* Smooth color cycling for Follow + Think modes */
  _startColorCycle(){
    setInterval(()=>{
      if (this.mode === "idle") return;

      const pal = this._getPalette();
      const colors = pal.cycleColors || [];
      if (!colors.length) return;

      this.colorIndex = (this.colorIndex+1) % colors.length;
      this._syncColor(colors[this.colorIndex]);
    }, this.cfg.cycleInterval);
  }

  /* Eyes blinking animation */
  _blinkOnce(){
    const H = this.cfg.eyeHeight;
    const L = this.leftEye;
    const R = this.rightEye;
    const baseY = this.baseLeft.y;

    const animate=(start,end,duration,cb)=>{
      const t0 = performance.now();
      const step = now=>{
        const t = Math.min((now-t0)/duration,1);
        const ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
        const v=start+(end-start)*ease;
        const off=(H-v)/2;
        L.setAttribute("height",v);
        R.setAttribute("height",v);
        L.setAttribute("y",baseY+off);
        R.setAttribute("y",baseY+off);
        if(t<1) requestAnimationFrame(step);
        else cb && cb();
      };
      requestAnimationFrame(step);
    };

    animate(H,1,90,()=> animate(1,H,120));
  }

  /* Blinking loop (runs in all modes) */
  _startBlink(){
    const loop=()=>{
      const delay = 2200 + Math.random()*2000;
      setTimeout(()=>{
        this._blinkOnce();
        loop();
      }, delay);
    };
    loop();
  }

  /* Eye tracking (Follow + Think) */
  _enableTracking(){
    document.addEventListener("mousemove", e=>{
      if (this.mode === "idle") {
        this._smoothCenterEyes();
        return;
      }

      const r = this.svg.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const cy = r.top  + r.height/2;

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;

      if (dist < this.cfg.deadZone) {
        this.leftEye .setAttribute("x", this.baseLeft.x);
        this.leftEye .setAttribute("y", this.baseLeft.y);
        this.rightEye.setAttribute("x", this.baseRight.x);
        this.rightEye.setAttribute("y", this.baseRight.y);
        return;
      }

      const f = Math.min((dist - this.cfg.deadZone)/this.cfg.falloff, 1);
      const offX = (dx/dist) * this.cfg.maxOffset * f;
      const offY = (dy/dist) * this.cfg.maxOffset * f;

      this.leftEye .setAttribute("x", this.baseLeft.x + offX);
      this.leftEye .setAttribute("y", this.baseLeft.y + offY);
      this.rightEye.setAttribute("x", this.baseRight.x + offX);
      this.rightEye.setAttribute("y", this.baseRight.y + offY);
    });
  }

  /* Smooth centering in Idle mode */
  _smoothCenterEyes(){
    const L = this.leftEye;
    const R = this.rightEye;
    const t = 0.15; // easing factor

    let lx = parseFloat(L.getAttribute("x"));
    let ly = parseFloat(L.getAttribute("y"));
    let rx = parseFloat(R.getAttribute("x"));
    let ry = parseFloat(R.getAttribute("y"));

    L.setAttribute("x", lx + (this.baseLeft.x  - lx) * t);
    L.setAttribute("y", ly + (this.baseLeft.y  - ly) * t);
    R.setAttribute("x", rx + (this.baseRight.x - rx) * t);
    R.setAttribute("y", ry + (this.baseRight.y - ry) * t);
  }

  /* Observe system theme changes and re-apply palette */
  _setupThemeObserver(){
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => this.handleThemeChange());
  }

  /* Public method: recompute theme and re-apply colors */
  handleThemeChange(){
    this.theme = this._detectTheme();
    this._applyBaseColor();
  }

  /* Public method: change mode */
  setMode(m){
    this.mode = m;
    this.wrapper.classList.remove("remy-thinking","remy-idle");

    if (m === "thinking") {
      this.wrapper.classList.add("remy-thinking");
    } else if (m === "idle") {
      this.wrapper.classList.add("remy-idle");
      this._applyBaseColor();
    } else {
      this._applyBaseColor();
    }
  }
}

/* DEMO INSTANCE */
const remy1 = new Remy({ container:"#remy1" });

/* MODE BUTTONS */
const btnFollow = document.getElementById("btnFollow");
const btnThink  = document.getElementById("btnThink");
const btnIdle   = document.getElementById("btnIdle");

function setActiveModeButton(btn){
  [btnFollow,btnThink,btnIdle].forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}

btnFollow.onclick = () => { remy1.setMode("follow");   setActiveModeButton(btnFollow); };
btnThink.onclick  = () => { remy1.setMode("thinking"); setActiveModeButton(btnThink);  };
btnIdle.onclick   = () => { remy1.setMode("idle");     setActiveModeButton(btnIdle);   };

setActiveModeButton(btnFollow);

/* THEME TOGGLE BUTTONS */
const themeAuto  = document.getElementById("themeAuto");
const themeLight = document.getElementById("themeLight");
const themeDark  = document.getElementById("themeDark");

function setActiveThemeButton(btn){
  [themeAuto, themeLight, themeDark].forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

/* Apply theme override and notify all Remy instances */
function applyThemeOverride(mode){
  const root = document.documentElement;
  if (mode === "auto") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }

  if (window.__remyInstances) {
    window.__remyInstances.forEach(instance => instance.handleThemeChange());
  }
}

themeAuto.onclick  = () => { applyThemeOverride("auto");  setActiveThemeButton(themeAuto);  };
themeLight.onclick = () => { applyThemeOverride("light"); setActiveThemeButton(themeLight); };
themeDark.onclick  = () => { applyThemeOverride("dark");  setActiveThemeButton(themeDark);  };

setActiveThemeButton(themeAuto);