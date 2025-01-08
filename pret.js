// At the top of the file, update the tokenData generation to be a function
function generateTokenData() {
	let newTokenData = "";
	for (let i = 0; i < 66; i++) {
		newTokenData = newTokenData + (Math.floor(Math.random() * 16)).toString(16);
	}
	return newTokenData;
}

// Update the global tokenData declaration
let tokenData = generateTokenData();
let R, w, h, sp, s, seg, tint, shade, hdif, vdif, colors, hu, sa, br, cy, motif, dbl, bm, bmcolor, hd, vd, steps;
let minseg, compprob, cyclprob, tintprob, satuprob, doubprob, beamprob, fhueprob, smooprob, hmin, vmin, maxsteps, smoothsteps;
let monochromatic, complementary, cycle, tinted, saturated, double, beam, reverse, horizontal, smooth, stepped;
let segments = [];
let hues= [];
let saturations= [];
let brightnesses= [];
let stepsArray = [];
let drawWidth, drawHeight;
let rt;

function setup() {
	w = window.innerWidth;
	h = window.innerHeight;
	createCanvas(w, h);
	background(0);
	noStroke();
	colorMode(HSB);
	angleMode(DEGREES);
	R = new Random();
	sp = [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 8, 8, 12];
	s = sp[R.random_int(0, sp.length - 1)];

	// settings
	minseg = 0.05;
	compprob = 0.01;
	cyclprob = 0.017; // reduced by s < 5 and compprob
	tintprob = 0.01;
	satuprob = 0.01;
	doubprob = s / 8; // reduced by s < 3 and cycleprob
	beamprob = 0.11; // reduced by s < 3
	fhueprob = 0.2;
	smooprob = 0.6;
	hmin = 100;
	vmin = 40;
	maxsteps = 10;
	smoothsteps = 1000;
	rt = 60;
	
	// Start the interval timer after setting rt
	setInterval(regenerate, rt * 1000);

	// set features
	complementary = cycle = tinted = saturated = double = beam = reverse = horizontal = smooth = stepped = false;
	if (R.random_bool(compprob)) {
		complementary = true;
	}
	if (R.random_bool(cyclprob) && s > 4 && !complementary) {
		cycle = true;
	}
	if (R.random_bool(tintprob + satuprob)) {
		if (R.random_bool(tintprob / (tintprob + satuprob))) {
			tinted = true;
		} else {
			saturated = true;
		}
	}
	if (R.random_bool(doubprob) && s > 2 && !cycle) {
		double = true;
	}
	if (R.random_bool(beamprob) && s > 2) {
		beam = true;
	}
	if (R.random_bool(0.5)) {
		reverse = true;
	}
	if (R.random_bool(0.5)) {
		horizontal = true;
	}

	// build segments
	segments.push(0);
	for (let i = 1; i < s; i ++) {
		seg = segments[i - 1] + (1 / s) + R.random_num(minseg - (1 / s), ((1 - minseg) / (s - 1)) - (1 / s));
		segments.push(seg);
	}
	segments.push(1);
	
	// build colors
	hdif = 0;
	vdif = 0;
	while (hdif < hmin && vdif < vmin) {
		
		// intial colors
		colors = [];
		for (let i = 0; i < s + 1; i++) {
			if (R.random_bool(fhueprob)) {
				hu = R.random_num(0, 360);
			} else {
				hu = R.random_num(180, 420) % 360;
			}
			if (R.random_bool(0.5) || hu < 120) {
				sa = R.random_num(10, 100);
				br = 100;
			} else {
				sa = 100;
				br = R.random_num(25, 100);
			}
			colors.push(color(hu, sa, br));
		}

		// 3-cycle
		if (cycle) {
			for (let i = 0; i < colors.length - 3; i++) {
				colors[i + 3] = colors[i];
			}
		}

		// tinted
		if (tinted) {
			for (let i = 0; i < colors.length; i++) {
				colors[i] = color(hue(colors[i]), 37, 100);
			}
		}

		// saturated
		if (saturated) {
			for (let i = 0; i < colors.length; i++) {
				colors[i] = color(hue(colors[i]), 100, 100);
			}
		}

		// complementary
		if (complementary) {
			for (let i = 1; i < colors.length; i++) {
				colors[i] = color((hue(colors[i - 1]) + 180) % 360, saturation(colors[i]), brightness(colors[i]));
			}
		}

		// double color
		if (double) {
			dbl = R.random_int(1, colors.length - 1);
			colors[dbl] = colors[dbl - 1];
		}

		// beams
		if (beam) {
			bm = R.random_int(1, colors.length - 2);
			if (R.random_bool(0.5) || tinted) {
				colors[bm] = color(0, 0, 100);
				bmcolor = "white";
			} else {
				colors[bm] = color(0, 100, 0);
				bmcolor = "black";
			}
		}

		// color difference
		for (let i = 0; i < colors.length; i++) {
			hues[i] = hue(colors[i]);
			saturations[i] = saturation(colors[i]);
			brightnesses[i] = brightness(colors[i]);
		}
		for (let i = 0; i < colors.length - 1; i++) {
			for (let j = i + 1; j < colors.length; j++) {
				hd = Math.abs(hues[j] - hues[i]);
				hd = Math.min(hd, 360 - hd);
				if (beam && (i - 1 == bm || i == bm)) {
					hd = 0;
				}
				if (hd > hdif) {
					hdif = hd;
				}
				vd = (Math.abs(saturations[j] - saturations[i]) + Math.abs(brightnesses[j] - brightnesses[i])) / 2;
				if (vd > vdif) {
					vdif = vd;
				}
			}
		}
	}

	// Handle transformations
	drawWidth = w;
	drawHeight = h;
	if (horizontal) {
		[drawWidth, drawHeight] = [h, w];
	}
	
	// Calculate initial steps array
	stepsArray = [];
	for (let i = 0; i < s; i++) {
		if (R.random_bool(smooprob)) {
			stepsArray.push(smoothsteps);
		} else {
			stepsArray.push(R.random_int(3, maxsteps));
		}
	}
}

function draw() {
	// Reset transformations at start of each draw
	resetMatrix();
	
	// Apply transformations
	if (reverse) {
		translate(w / 2, h / 2);
		rotate(180);
		translate(-w / 2, -h / 2);
	}
	
	if (horizontal) {
		// Translate to center of window first
		translate(w / 2, h / 2);
		// Rotate
		rotate(-90);
		// Translate back by the swapped dimensions to center the rotated content
		translate(-h / 2, -w / 2);
	}
	
	// Draw progressions
	for (let i = 0; i < s; i++) {
		steps = stepsArray[i];
		if (steps === smoothsteps && (dbl == null || i != dbl - 1)) {
				smooth = true;
		} else if (dbl == null || i != dbl - 1) {
				stepped = true;
		}
		drawProgression(colors[i], colors[i + 1], segments[i], segments[i + 1], steps);
	}
}

function keyPressed() {
	if (key === 's' || key === 'S') {
		saveCanvas(tokenData, 'png');
	}
}

function drawProgression(p1, p2, a, b, n) {
	colorMode(RGB);
	for (let i = 0; i < n; i++) {
		fill(betterLerp(p1, p2, i / n));
		rect(0, Math.floor((a * drawHeight) + i * ((b - a) * drawHeight) / n), drawWidth, Math.ceil(((b - a) * drawHeight) / n));
	}
	colorMode(HSB);
}

function rgbToLab(c) {
  let r = red(c) / 255;
  let g = green(c) / 255;
  let b = blue(c) / 255;
  if (r > 0.04045) {
    r = Math.pow((r + 0.055) / 1.055, 2.4);
  } else {
    r = r / 12.92;
  }
  if (g > 0.04045) {
    g = Math.pow((g + 0.055) / 1.055, 2.4);
  } else {
    g = g / 12.92;
  }
  if (b > 0.04045) {
    b = Math.pow((b + 0.055) / 1.055, 2.4);
  } else {
    b = b / 12.92;
  }
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;
	x = x / 95.047;
	y = y / 100;
	z = z / 108.883;
  if (x > 0.008856) {
    x = Math.pow(x, 1 / 3);
  } else {
    x = (7.787 * x) + 16 / 116;
  }
  if (y > 0.008856) {
    y = Math.pow(y, 1 / 3);
  } else {
    y = (7.787 * y) + 16 / 116;
  }
  if (z > 0.008856) {
    z = Math.pow(z, 1 / 3);
  } else {
    z = (7.787 * z) + 16 / 116;
  }
  let cl = (116 * y) - 16;
  let ca = 500 * (x - y);
  let cb = 200 * (y - z);
  return [cl, ca, cb];
}

function labToRgb(a) {
  let cl = a[0];
  let ca = a[1];
  let cb = a[2];
  let y = (cl + 16) / 116;
  let x = ca / 500 + y;
  let z = y - cb / 200;
  if (Math.pow(y, 3) > 0.008856) {
    y = Math.pow(y, 3);
  } else {
    y = (y - 16 / 116) / 7.787;
  }
  if (Math.pow(x, 3) > 0.008856) {
    x = Math.pow(x, 3);
  } else {
    x = (x - 16 / 116) / 7.787;
  }
  if (Math.pow(z, 3) > 0.008856) {
    z = Math.pow(z, 3);
  } else {
    z = (z - 16 / 116) / 7.787;
  }
  x = x * 95.047;
  y = y * 100;
  z = z * 108.883;
  let r = (x * 3.2406 + y * -1.5372 + z * -0.4986) / 100;
  let g = (x * -0.9689 + y * 1.8758 + z * 0.0415) / 100;
  let b = (x * 0.0557 + y * -0.2040 + z * 1.0570) / 100;
  if (r > 0.0031308) {
    r = 1.055 * Math.pow(r, 1 / 2.4) - 0.055;
  } else {
    r = 12.92 * r;
  }
  if (g > 0.0031308) {
    g = 1.055 * Math.pow(g, 1 / 2.4) - 0.055;
  } else {
    g = 12.92 * g;
  }
  if (b > 0.0031308) {
    b = 1.055 * Math.pow(b, 1 / 2.4) - 0.055;
  } else {
    b = 12.92 * b;
  }
  r = r * 255
  g = g * 255
  b = b * 255
  return color(Math.round(r), Math.round(g), Math.round(b));
}

// thank you easyrgb.com for the conversion formulas

function betterLerp(col1, col2, t) {
  let arr1 = rgbToLab(col1);
  let arr2 = rgbToLab(col2);
  let lab = [];
	lab[0] = arr1[0] + t * (arr2[0] - arr1[0]);
	lab[1] = arr1[1] + t * (arr2[1] - arr1[1]);
	lab[2] = arr1[2] + t * (arr2[2] - arr1[2]);
  return labToRgb(lab);
}

function scramble(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = R.random_int(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

class Random {
  constructor() {
    this.useA = false;
    let sfc32 = function (uint128Hex) {
      let a = parseInt(uint128Hex.substr(0, 8), 16);
      let b = parseInt(uint128Hex.substr(8, 8), 16);
      let c = parseInt(uint128Hex.substr(16, 8), 16);
      let d = parseInt(uint128Hex.substr(24, 8), 16);
      return function () {
        a |= 0; b |= 0; c |= 0; d |= 0;
        let t = (((a + b) | 0) + d) | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
      };
    };
    this.prngA = new sfc32(tokenData.substr(2, 32));
    this.prngB = new sfc32(tokenData.substr(34, 32));
    for (let i = 0; i < 1e6; i += 2) {
      this.prngA();
      this.prngB();
    }
  }
  random_dec() {
    this.useA = !this.useA;
    return this.useA ? this.prngA() : this.prngB();
  }
  random_num(a, b) {
    return a + (b - a) * this.random_dec();
  }
  random_int(a, b) {
    return Math.floor(this.random_num(a, b + 1));
  }
  random_bool(p) {
    return this.random_dec() < p;
  }
  random_choice(list) {
    return list[this.random_int(0, list.length - 1)];
  }
}

// Add new regenerate function
function regenerate() {
	
	// Clear canvas and reset transformations
	background(0);
	resetMatrix();
	
	// Generate new token and reset variables
	tokenData = generateTokenData();
	R = new Random();
	
	// Reset arrays
	segments = [];
	hues = [];
	saturations = [];
	brightnesses = [];
	
	// Re-run setup logic
	sp = [2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 8, 8, 12];
	s = sp[R.random_int(0, sp.length - 1)];
	
	// Reset all the boolean flags
	complementary = cycle = tinted = saturated = double = beam = reverse = horizontal = smooth = stepped = false;
	
	// Re-run all the setup logic for features and segments
	if (R.random_bool(compprob)) {
		complementary = true;
	}
	if (R.random_bool(cyclprob) && s > 4 && !complementary) {
		cycle = true;
	}
	if (R.random_bool(tintprob + satuprob)) {
		if (R.random_bool(tintprob / (tintprob + satuprob))) {
			tinted = true;
		} else {
			saturated = true;
		}
	}
	if (R.random_bool(doubprob) && s > 2 && !cycle) {
		double = true;
	}
	if (R.random_bool(beamprob) && s > 2) {
		beam = true;
	}
	if (R.random_bool(0.5)) {
		reverse = true;
	}
	if (R.random_bool(0.5)) {
		horizontal = true;
	}
	
	// Rebuild segments
	segments.push(0);
	for (let i = 1; i < s; i++) {
		seg = segments[i - 1] + (1 / s) + R.random_num(minseg - (1 / s), ((1 - minseg) / (s - 1)) - (1 / s));
		segments.push(seg);
	}
	segments.push(1);
	
	// Rebuild colors
	hdif = 0;
	vdif = 0;
	while (hdif < hmin && vdif < vmin) {
		
		// intial colors
		colors = [];
		for (let i = 0; i < s + 1; i++) {
			if (R.random_bool(fhueprob)) {
				hu = R.random_num(0, 360);
			} else {
				hu = R.random_num(180, 420) % 360;
			}
			if (R.random_bool(0.5) || hu < 120) {
				sa = R.random_num(10, 100);
				br = 100;
			} else {
				sa = 100;
				br = R.random_num(25, 100);
			}
			colors.push(color(hu, sa, br));
		}

		// 3-cycle
		if (cycle) {
			for (let i = 0; i < colors.length - 3; i++) {
				colors[i + 3] = colors[i];
			}
		}

		// tinted
		if (tinted) {
			for (let i = 0; i < colors.length; i++) {
				colors[i] = color(hue(colors[i]), 37, 100);
			}
		}

		// saturated
		if (saturated) {
			for (let i = 0; i < colors.length; i++) {
				colors[i] = color(hue(colors[i]), 100, 100);
			}
		}

		// complementary
		if (complementary) {
			for (let i = 1; i < colors.length; i++) {
				colors[i] = color((hue(colors[i - 1]) + 180) % 360, saturation(colors[i]), brightness(colors[i]));
			}
		}

		// double color
		if (double) {
			dbl = R.random_int(1, colors.length - 1);
			colors[dbl] = colors[dbl - 1];
		}

		// beams
		if (beam) {
			bm = R.random_int(1, colors.length - 2);
			if (R.random_bool(0.5) || tinted) {
				colors[bm] = color(0, 0, 100);
				bmcolor = "white";
			} else {
				colors[bm] = color(0, 100, 0);
				bmcolor = "black";
			}
		}

		// color difference
		for (let i = 0; i < colors.length; i++) {
			hues[i] = hue(colors[i]);
			saturations[i] = saturation(colors[i]);
			brightnesses[i] = brightness(colors[i]);
		}
		for (let i = 0; i < colors.length - 1; i++) {
			for (let j = i + 1; j < colors.length; j++) {
				hd = Math.abs(hues[j] - hues[i]);
				hd = Math.min(hd, 360 - hd);
				if (beam && (i - 1 == bm || i == bm)) {
					hd = 0;
				}
				if (hd > hdif) {
					hdif = hd;
				}
				vd = (Math.abs(saturations[j] - saturations[i]) + Math.abs(brightnesses[j] - brightnesses[i])) / 2;
				if (vd > vdif) {
					vdif = vd;
				}
			}
		}
	}
	
	// Calculate steps for each segment before the redraw
	stepsArray = [];
	for (let i = 0; i < s; i++) {
		if (R.random_bool(0.5)) {
			stepsArray.push(smoothsteps);
		} else {
			stepsArray.push(R.random_int(3, maxsteps));
		}
	}
	
	// Handle transformations
	drawWidth = w;
	drawHeight = h;
	if (horizontal) {
		[drawWidth, drawHeight] = [h, w];
	}
	
	// Force a redraw
	redraw();
}
