/* -------------------------------------

To do

- consider css transitions and transformations instead of svg.js
  - can't use to position, use svg.js instead 
    (ie/edge support issues https://css-tricks.com/transforms-on-svg-elements/)

- mobile
  - different tree positions
  - home  - long svg
    mid   - shorter svg, ui markup appears
    story - no svg, ui markup appears


SELECT A TREE
- #header: change class (- home, + full)
- #header: add area class (after removing all area classes)
- move tree and hide others
- make sure content below is hidden

SELECT A STORY
- if tree is not selected, do it
- show story content

------------------------------------- */

var cnt = document.getElementById("container");
var animms = 600;

var state = {
  loadingData: true,
  flatData: null,
  data: {},
  dataCopy: {},
  logp: null,
  p5setupDone: false,
  p5Finished: false,
  w: cnt.offsetWidth,
  h: cnt.offsetHeight,
  treePositions: {},
  selectedArea: null,
  firstDate: moment(),
  lastDate: moment("2000-01-01"),
};

setupLogP();

loadData("data/all-17-april-placehold.json", function (fullTreeData) {
  state.data = fullTreeData;
  console.log("state.data", state.data);
  state.loadingData = false;
  state.logp.innerText = "data loaded.";
});


// ----------------------------------------------
// jQuery start
// ----------------------------------------------

$(document).ready(function() {
  updateTopBtn($(document).scrollTop());
});

// ----------------------------------------------
// SVG.js
// ----------------------------------------------

var svg = SVG().addTo('#container')
  .size(state.w, state.h)
  .addClass("artboard");

var svgStyles = {
  "normal": {
    "stroke": "#f06",
    "stroke-width": 1,
    "fill": "none",
    "stroke-linecap": "round"
  },
  "friut": {
    "fill": "#E75F52",
    "stroke": "#EAEBEB",
    "stroke-width": 1,
  },
  "friut-selected": {
    "fill": "none",
    "stroke": "#E75F52",
    "stroke-width": 0.5,
    "opacity": 0,
  },
  "hover": {
    "stroke": "#000",
    "stroke-width": 2,
    "fill-opacity": 0,
  },
  "transp-sensi": {
    "stroke": "#000",
    "stroke-opacity": 0,
    "stroke-width": 10,
    "fill": "none",
  },
};

var csize = 5;
var csize2 = 12;

/*
function svgBranchStraight (x1, y1, x2, y2, props) {
  var g = svg.group()
    .addClass("branch-g")
    .attr("id", props.id)
    .data(props);
  g.line(x1, y1, x2, y2)
    .stroke({ color: '#f06', opacity: 0.6, width: 1 })
    .addClass("branch-path");
  g.line(x1, y1, x2, y2)
    .stroke({ color: '#f06', opacity: 0, width: 8 });
}
*/

function svgBranchCurved (mx,my, x1,y1, x2,y2, x,y, props) {
  var g = svg.group()
    .addClass("branch-g").addClass(props.class)
    .attr("id", props.id)
    .data(props);
  var additionalStyle = {
    "stroke-width": (props.depth < 3) ? 2 : (props.depth == 3) ? 0.7 : 0.5,
    "stroke": (props.depth <= 3) ? "#000" : "#E75F52",
    "stroke-dasharray": (props.dimension != "level") ? "" 
      : (props.value == "local") ? "7 5"
      : (props.value == "individual") ? "0 5"
      : "",
  };
  var pathString = "M"+mx+" "+my+" C"+x1+" "+y1+" "+x2+" "+y2+" "+x+" "+y;
  g.path(pathString)
    .attr(svgStyles.normal)
    .attr(additionalStyle)
    .addClass(props.class)
    .addClass("branch-path");
  if (props.dimension == "story") {
    g.path(pathString).attr(svgStyles["transp-sensi"]);
    g.circle(csize).attr(svgStyles.friut).attr({ cx: x, cy: y });
    g.circle(csize).attr(svgStyles["transp-sensi"]).attr({ cx: x, cy: y });
    g.circle(csize2).attr(svgStyles["friut-selected"]).addClass("selection-circle").attr({ cx: x, cy: y });
  }
  return g;
}


// ----------------------------------------------
// P5
// ----------------------------------------------

var trees = {


  "europe": null,
  "north-america": null,
  "asia-oceania": null,
  "latin-america": null,
  "africa": null,

  // "north-america": null,
  // "south-america": null,
  // "europe": null,
  // "africa": null,
  // "asia": null,
  // "oceania": null,
};
// var tf = new Transformer();

// PARAMS
// var len0 = 70;
var lenW = state.w * 0.05;
var lenH = state.h * 0.14;
var len0 = Math.min(lenW, lenH);

function setup() {
  var cvs = createCanvas(100, 100);
  cvs.parent("container");
  resizeCanvas(state.w, state.h);
}

function setup2 () {
  function randomAngle (max) {
    return map(random(1), 0,1, -max, max);
  } 
  Object.keys(trees).forEach(function(key, i) {
    var data = _.find(state.data.children, function (e) { return e.props.id == key; });
    var totalTreeStories = countChildren(data);
    data.props.totalTreeStories = totalTreeStories;
    var b = new Branch (data.children, null, len0*0.5, randomAngle(PI/30), data.props);
    var t = new Tree (createVector(0,0), b);
    trees[key] = t;
  });
  state.p5setupDone = true; 
}

function draw() {
  console.log("loop n "+ frameCount);
  if (state.loadingData) {
    return;
  }
  if (!state.p5setupDone) {
    setup2();
  }

  var treesNotDrawn = Object.keys(trees)
    .map(function(k) { return trees[k]; })
    .filter(function(t) { return t.drawn === false; })
    .length;

  if (treesNotDrawn > 0) {
    Object.keys(trees).forEach(function(key, i) {
      trees[key].display();
    });
  } else {
    noLoop();
    addListeners();
    initialize();
  }

}

// ----------------------------------------------
// Tree Class
// ----------------------------------------------

function Tree (root, branch0) {
 
  // construct

  this.id = branch0.props.id;
  this.root = root;
  this.branches = [];
  this.storyCount = countChildren(branch0, 0);
  this.drawn = false;
  this.svgGroup = svg.group()
    .addClass("tree").addClass("hide")
    .attr({ "id": branch0.props.id });
 
  // methods essential to construct

  this.addBranch = function (b) {
    b.attachTo(this);
    this.branches.push(b);
  }
  
  // finish to construct
  
  this.addBranch(branch0);

  // other methods --- draw

  this.display = function () {
    if (this.drawn) {
      return;
    }
    var branchesNotDrawn = 0;
    for (var i = 0; i < this.branches.length; i++) {
      this.branches[i].branch();
      this.branches[i].display();
      if (!this.branches[i].drawn) {
        branchesNotDrawn++;
      }
    }
    if (branchesNotDrawn == 0){
      this.complete();
    }
  }

  this.complete = function () {
    
    // --- draw bg, root point, data circle and Area name

    this.svgGroup
      .rect(this.svgGroup.bbox().w, this.svgGroup.bbox().h)
      .move(this.svgGroup.bbox().x, this.svgGroup.bbox().y)
      .back()
      .attr({ "fill": "red", "opacity": 0 });

    // var circleDiameter = this.storyCount * len0/10;
    var circleDiameter = Math.sqrt(this.storyCount/PI) * len0 * 0.7;

    this.svgGroup
      .circle(circleDiameter)
      .cx(0).cy(0)
      .addClass("story-count")
      .back()
      .attr({ "fill": "#3EBFB9", opacity: 0.25 });

    // Math.sqrt()

    // this.svgGroup
    //   .line(0,0, ).cx(0).cy(0)
    //   .addClass("root-point")
    //   .attr({ "fill": "black" });

    this.svgGroup
      .circle(4).cx(0).cy(0)
      .addClass("root-point")
      .attr({ "fill": "black" });

    var areaNames = {
      "north-america":  "North America",
      "latin-america":  "Latin America",
      "europe":         "Europe",
      "africa":         "Africa",
      "asia-oceania":   "Asia & Oceania",
    };
    var gt = this.svgGroup.group();
    gt.text(areaNames[this.id]).x(0).y(50)
      .addClass("font-serif-m")
      .font({ 
        // "fill": "black",
        "anchor": "middle",
      });
    gt.text(this.storyCount + (this.storyCount == 1 ? " story" : " stories")).x(0).y(80)
      .addClass("font-small-stories")
      .font({ "anchor": "middle" });

    this.drawn = true;
    this.rootPoint = {};
    this.rootPoint.x = this.svgGroup.bbox().x;
    this.rootPoint.y = this.svgGroup.bbox().y;
  }

  // other methods --- after drawn

  // this.rootPoint = function () {
  //   var rootBranch = this.svgGroup.findOne(".branch-area");
  //   if (!rootBranch.hasOwnProperty("_array")) {
  //     this.svgGroup.dmove(0, 0);
  //   }
  //   var origin = [rootBranch._array[0][1], rootBranch._array[0][2]];
  //   console.log(origin);
  // }

  this.moveRoot = function (x, y, animate) {
    var ms = (animate === true) ? animms : 1;
    this.svgGroup.animate(ms).move(x + this.rootPoint.x, y + this.rootPoint.y);
  }

  this.moveCenter = function (x, y, animate) {
    var ms = (animate === true) ? animms : 1;
    this.svgGroup.animate(ms).move(x - this.svgGroup.bbox().w/2, y - this.svgGroup.bbox().h/2);
  }

  this.show = function (/*animate*/) {
    // var ms = (animate === true) ? animms : 1;
    // this.svgGroup.animate(ms).opacity(1);
    this.svgGroup.removeClass("hide");
  }

  this.hide = function (/*animate*/) {
    // var ms = (animate === true) ? animms : 1;
    // this.svgGroup.animate(ms).opacity(0);
    this.svgGroup.addClass("hide");
  }

  this.isVisible = function () {
    return !this.svgGroup.hasClass("hide");
  }

  this.moveLeft = function (animate) {
    this.moveCenter(state.w*0.25, state.h/2, animate);
    this.svgGroup.addClass("selected");
  }

  this.moveInPosition = function (animate) {
    var pos = state.treePositions[this.id];
    this.moveRoot(pos.x, pos.y, animate);
    this.svgGroup.removeClass("selected");
  }

  this.selectStory = function (id) {

  }

  this.scale = function (factor, animate) { // BROKEN
    var ms = (animate === true) ? animms : 1;
    this.svgGroup
      .animate(ms)
      .transform({
        translateX: -this.rootPoint.x,
        translateY: -this.rootPoint.y,
        scale: factor 
      });

  }
}

// ----------------------------------------------
// Branch Class
// ----------------------------------------------

function Branch (children, start, len, angle, props) {

  // construct

  this.tree = null;
  this.children = children;
  this.start = (start != null) ? start.copy() : createVector(0,0);
  this.len = len;
  this.angle = angle;
  this.props = props;
  this.curveDir = this.props.hasOwnProperty("forceCurveDir") 
    ? this.props.forceCurveDir
    : (random(1) > 0.5) ? -1 : 1;
  
  this.dir = createVector(0, 1);
  this.dir.mult(this.len);
  this.dir.rotate(this.angle);
  this.end = p5.Vector.sub(this.start, this.dir);

  this.branched = false;
  this.drawn = false;

  // methods

  this.attachTo = function (tree) {
    this.tree = tree;
  }

  this.branch = function () {
    if (!this.branched && this.children.length > 0) {

      // --- count total children

      var normAngles = [];
      var totalCount = countChildren(this);
      var normSum = 0;
      this.children.forEach(function (child) {
        var count = countChildren(child);
        var norm = count/totalCount;
        var normAngle = normSum + norm/2;
        normAngles.push(normAngle);
        normSum += norm;
      });

      // --- make branches

      for (var i = 0; i < this.children.length; i++) {
        
        // --- PARAMS
        var chNum = countChildren(this.children[i], 0);
        var dimension = this.children[i].props.dimension;
        var newLen = (dimension == "area") ? len0 * 0.2 // never happens, defined on tree creation
          : (dimension == "level") ? len0           * map(chNum, 1,25, 1, 2.5)  // level
          : (dimension == "sector") ? len0          * random(0.5, 0.8)  // sector
          : len0                                    * random(0.4, 0.6); // story
        
        // total angle --- ( PI = 180° )
        var availableAngle = (dimension == "level") 
          ? PI * 0.45 * map(this.props.totalTreeStories, 1,35, 0.8, 1.6)
          : PI * 0.55;

        var startAngle = -availableAngle/2;
        var newRelAngle = startAngle + availableAngle*normAngles[i];
        var newAngle = this.angle + newRelAngle; //randomAngle(PI/5);

        // edit props
        this.children[i].props.totalTreeStories = this.props.totalTreeStories;
        if (this.children.length == 1) {
          this.children[i].props.forceCurveDir = -this.curveDir;
        }

        var b = new Branch(
          this.children[i].children, 
          this.end.copy(), 
          newLen, 
          newAngle, 
          this.children[i].props);
        this.tree.addBranch(b);
      }
      this.branched = true;
    }
  }

  this.display = function () {
    if (this.drawn) {
      return;
    }

    // control points
    var angle = PI/15;
    var mag = 0.3;
    var v1 = p5.Vector.sub(this.end, this.start);
    var v2 = p5.Vector.sub(this.start, this.end);
    
    // var angle1 = random() > 0.5 ? angle : -angle;
    var angle1 = angle * this.curveDir;

    var angle2 = angle1 != angle ? angle : -angle;
    var p1 = v1.rotate(angle1).mult(mag).add(this.start);
    var p2 = v2.rotate(angle2).mult(mag).add(this.end);

    var path = svgBranchCurved(
      this.start.x, this.start.y, 
      p1.x,         p1.y, 
      p2.x,         p2.y, 
      this.end.x,   this.end.y,
      this.props);
    this.tree.svgGroup.add(path);

    this.drawn = true;
  }
}


// ----------------------------------------------
// Listeners & functions
// ----------------------------------------------

// --- Regarding interaction w/ trees and branches

function initialize () {

  state.treePositions = updateTreesPos();

  Object.keys(trees).forEach(function (k) {
    // trees[k].hide();
    trees[k].moveInPosition();
  });
  setTimeout(function() {
    Object.keys(trees).forEach(function (k) {
      trees[k].show();
    });
  }, animms);
}


function updateTreesPos () {
  var x1 = state.w * 0.15;
  var x4 = state.w * 0.325;
  var x2 = state.w * 0.50;
  var x5 = state.w * 0.675;
  var x3 = state.w * 0.85;
  var y1 = state.h * 0.45;
  var y2 = state.h * 0.80;
  return {
    "north-america":  { "x": x1, "y": y1 },
    "europe":         { "x": x2, "y": y1 },
    "asia-oceania":   { "x": x3, "y": y1 },
    "latin-america":  { "x": x4, "y": y2 },
    "africa":         { "x": x5, "y": y2 },
  };
}


function showTrees (/*animate*/) {
  Object.keys(trees).forEach(function (k) {
    if (!trees[k].isVisible()) {
      trees[k].show(/*animate*/);
    }
  });
}


function hideTrees (/*animate*/) {
  Object.keys(trees).forEach(function (k) {
    if (trees[k].isVisible()) {
      trees[k].hide(/*animate*/);
    }
  });
}


function repositionAllTrees (animate) {
  Object.keys(trees).forEach(function (k) {
    var pos = state.treePositions[k];
    trees[k].moveRoot(pos.x, pos.y, animate);
  });
}


function selectArea (id) {

  // deselect

  if (id === null) {
    if (state.selectedArea !== null) {
      var oldId = state.selectedArea;
      trees[oldId].moveInPosition(true);
      setTimeout(function() { showTrees(); }, animms/2);
      state.selectedArea = null;
    }
    updateHeader();
    return;
  }

  if (state.selectedArea !== null) {

    // swap selection

    var oldId = state.selectedArea;
    state.selectedArea = id;
    trees[oldId].hide();
    trees[oldId].svgGroup.removeClass("selected"); // hack
    setTimeout(function() { 
      trees[oldId].moveInPosition(); 
      trees[state.selectedArea].moveLeft();
    }, animms);
    setTimeout(function() { 
      trees[state.selectedArea].show();
    }, animms*2);
  
  } else {
    
    // all > select one

    state.selectedArea = id;
    trees[state.selectedArea].moveLeft(true); 
    hideTrees();
    setTimeout(function() { 
      trees[state.selectedArea].show();
    }, animms*2);
  }

  toggleBelow(false);
  updateHeader();
}


function updateHeader () {
  $("#header")
    .removeClass("europe")
    .removeClass("north-america")
    .removeClass("asia-oceania")
    .removeClass("latin-america")
    .removeClass("africa");
  if (state.selectedArea){
    $("#header").addClass(state.selectedArea);
  }
}


function handleStoryClick (d) {

  // --- prepare / parse

  var area = d.id.split("---")[0];
  var level = d.id.split("---")[1];
  var sector = d.id.split("---")[2];
  var slug = d.value;
  var areaCopy = d.area;
  var levelCopy = d.levelSimplified;
  var sectorCopy = d.sector;
  var textCopy = state.dataCopy[slug].text;
  var titleCopy = d.title;
  var date = moment(d.date);
  console.log("--------------------");
  console.log(d);
  console.log(areaCopy);
  console.log(levelCopy);
  console.log(sectorCopy);
  console.log(titleCopy);
  console.log(textCopy);
  console.log(date);

  // --- tree / area

  if (state.selectedArea === null || state.selectedArea !== area) {
    selectArea(area);
  }
  
  // --- timeline
  
  // --- story

}

// --- Listeners and events

function addListeners () {

  $("svg .branch-g").mouseover(function(e){ 
    // this.instance.find(".branch-path").animate(200).attr(svgStyles.hover);
    this.instance.find(".selection-circle").attr({ opacity: 1 });
    state.logp.innerText = this.dataset.value.toUpperCase();
  });

  $("svg .branch-g").mouseout(function(e){ 
    // this.instance.find(".branch-path").animate(200).attr(svgStyles.normal);
    this.instance.find(".selection-circle").attr({ opacity: 0 });
    state.logp.innerText = "";
  });

  $("svg .branch-story").click(function(e){ 
    e.stopPropagation();
    handleStoryClick(this.dataset);
  });

  $("svg g.tree").click(function(e){ 
    // if (!trees[this.id].isVisible()) {
    //   return;
    // }
    if (state.selectedArea !== this.id) {
      selectArea(this.id);
    }
  });

  $("#header .item").click(function(e) {
    handleMenuClick(e.target.dataset.type, e.target.dataset.value);
  });

  $("#header .logo").click(function(e) {
    handleMenuClick("area", null);
  });

  $("#to-top").click(function() {
    // $(this).addClass("hide");
    $("html, body").animate({ "scrollTop": 0 }, animms);
  });

  $(document).scroll(function () {
    var scroll = $(document).scrollTop();
    updateTopBtn(scroll);
  });
}


function handleMenuClick (type, value) {

  if (type == "area") {

    if (value === state.selectedArea) {
      selectArea(null);
    } else {
      selectArea(value);
    }

    if (value === null) {
      toggleBelow(true);
    }
  } else if (type == "anchor") {
    var wait = 0;
    if (state.selectedArea !== null) {
      selectArea(null);
      wait = animms;
    }
    setTimeout(function() {
      toggleBelow(true, function () {
        var to = $("#"+ value).offset().top;
        $("html, body").animate({ "scrollTop": to }, animms);
      });
    }, wait);
  }
}


// --- Utilities


function updateTopBtn (scroll) {
  var limit = 200;
  if (scroll > limit && $("#to-top").hasClass("hide")) {
    $("#to-top").removeClass("hide");
  }
  if (scroll <= limit && !$("#to-top").hasClass("hide")) {
    $("#to-top").addClass("hide");
  }
}

// WIP
// WIP
// WIP
// WIP
// WIP
// WIP
// WIP
// WIP
function createTimeline (area) {
  state.flatData.filter(function(d) {
    return d.area.slug() == area;
  }).map(function(d) {
    return d.area.slug() == area;
  });
}


function toggleBelow (show, callback) {

  if (!$("#below").hasClass("hide") === show) {
    if (callback) {
      callback();
    }
    return;
  }

  if (show === true) {
    $("#below").removeClass("hide");
    if (callback) {
      callback();
    }
  } else if (show === false) {
    $("html, body").animate({ "scrollTop": 0 }, animms, function() {
      $("#below").addClass("hide");
    });
  } else {
    throw "show parameter missing.";
  }
}


function countChildren (item, sum) {
  currentSum = sum ? sum : 0;
  if (item.children.length == 0) return 1;
  var newSum = 0;
  item.children.forEach(function(c) {
    newSum += countChildren(c, currentSum);
  });
  return newSum + currentSum;
}


function setupLogP () {
  state.logp = document.createElement("p");
  state.logp.classList.add("log");
  document.body.appendChild(state.logp);
  state.logp.innerText = "loading data";
}


function loadData (file, callback) {
  var middata = {};
  $.getJSON( file, function(jsonData) {

    state.flatData = jsonData;

    // --- mid data structure
  
    for (var i = 0; i < jsonData.length; i++) {
      var d = jsonData[i];
      var area = d.area.slug();
      var level = d["level-simplified"].slug();
      var sector = d.sector.slug();
      if (!middata.hasOwnProperty(area)) {
        middata[area] = {};
      }
      if (!middata[area].hasOwnProperty(level)) {
        middata[area][level] = {};
      }
      if (!middata[area][level].hasOwnProperty(sector)) {
        middata[area][level][sector] = [];
      }
      middata[area][level][sector].push(d);
    }
    console.log("middata", middata);

    // --- full tree data structure

    fullTreeData = {
      "children": [],
      "props": {
        "id": "data-root",
        "depth": 0,
      }
    };
    var areas = Object.keys(middata);
    for (var i = 0; i < areas.length; i++) {
      var area = areas[i];
      var areaChildrenArray = [];
      fullTreeData.children.push({
        "children": areaChildrenArray,
        "props": {
          "id": area,
          "depth": 1,
          "dimension": "area",
          "value": area,
          "class": "branch-area"
        }
      });
      var levels = Object.keys(middata[area]);
      for (var j = 0; j < levels.length; j++) {
        var level = levels[j];
        var levelChildrenArray = [];
        areaChildrenArray.push({
          "children": levelChildrenArray,
          "props": {
            "id": area +"---"+ level,
            "depth": 2,
            "dimension": "level",
            "value": level,
            "class": "branch-level"
          }
        });
        var sectors = Object.keys(middata[area][level]);
        for (var k = 0; k < sectors.length; k++) {
          var sector = sectors[k];
          var sectorChildrenArray = middata[area][level][sector].map(function (d, di) {
            var storyTitle = d.title;
            var storyText = d.text;
            var storySlug = d.title.slug();
            state.dataCopy[storySlug] = {
              "title": storyTitle,
              "text": storyText,
            };
            var date = moment(d.date);
            if (date.isAfter(state.lastDate)) {
              state.lastDate = date;
            }
            if (date.isBefore(state.firstDate)) {
              state.firstDate = date;
            }
            delete d.text;
            var props = $.extend({}, d, {
              "id": area +"---"+ level +"---"+ sector +"---"+ di,
              "depth": 4,
              "dimension": "story",
              "value": storySlug,
              "class": "branch-story",
            });
            return {
              "children": [],
              "props": props
            };
          });
          levelChildrenArray.push({
            "children": sectorChildrenArray,
            "props": {
              "id": area +"---"+ level +"---"+ sector,
              "depth": 3,
              "dimension": "sector",
              "value": sector,
              "class": "branch-sector"
            }
          });
        }
      }
    }

    callback(fullTreeData);
  }); 
}
