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

var releaseFolder = "content/200418-dev";
// var releaseFolder = "content/200420-amy-test";

var cnt = document.getElementById("container");
var animms = 600;
var templates = {};

var state = {
  loadingData: true,
  flatData: null,
  data: {},
  storiesMap: {},
  p5setupDone: false,
  p5Finished: false,
  w: cnt.offsetWidth,
  h: cnt.offsetHeight,
  treePositions: {},
  selectedTree: null,
  firstDate: moment(),
  lastDate: moment("2000-01-01"),
  isMobile: isMobile(),
  currentPage: {},
};

loadData(releaseFolder +"/data.json", function (fullTreeData) {
  state.data = fullTreeData;
  console.log("state.data", state.data);
  state.loadingData = false;
});


// ----------------------------------------------
// jQuery start
// ----------------------------------------------

// $(document).ready(function() {
// });

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
    "stroke-width": 1,
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
if (state.isMobile) {
  len0 = state.w * 0.06;
}

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
    registerTemplates();
    setTimeout(function () { remove(); }, 200); // remove p5 sketch and canvas
  }

}
function registerTemplates () {
  templates.storyPreviews = Handlebars.compile($("#template-story-previews").html());
  templates.areaStats     = Handlebars.compile($("#template-area-stats").html());
  templates.story         = Handlebars.compile($("#template-story").html());

  // use
  // var html1 = templates.storyPreviews({ title: "Story A" });
  // var html2 = templates.areaStats({ value: "12" });

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
    var y1 = len0 * 0.55 + 5;
    gt.text(areaNames[this.id]).x(0).y(y1)
      .addClass("font-serif-m")
      .font({ 
        // "fill": "black",
        "anchor": "middle",
      });
    gt.text(this.storyCount + (this.storyCount == 1 ? " story" : " stories")).x(0).y(y1 + 30)
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
    if (isMobile()) {
      var x = state.w / 2;
      var y = state.treePositions[Object.keys(state.treePositions)[0]].y;
      this.moveRoot(x, y, animate);
      this.svgGroup.addClass("selected");      
    } else {
      this.moveCenter(state.w*0.25, state.h * 0.45, animate);
      this.svgGroup.addClass("selected");
    }
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
  if (state.isMobile) {
    var x1 = state.w * 0.3;
    var x2 = state.w * 0.7;
    var mt = 40;
    var mb = 20;
    var y1 = mt + ((state.h - mt - mb) * 0.333) - 150; // state.h * 0.22;
    var y2 = mt + ((state.h - mt - mb) * 0.666) - 150; // state.h * 0.52;
    var y3 = mt + ((state.h - mt - mb) * 0.999) - 150; // state.h * 0.82;
    return {
      "north-america":  { "x": x1, "y": y1 },
      "europe":         { "x": x2, "y": y1 },
      "asia-oceania":   { "x": x1, "y": y2 },
      "latin-america":  { "x": x2, "y": y2 },
      "africa":         { "x": x1, "y": y3 },
    };
  } else {
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


function deselectAllBranches () {
  $(".branch-g").removeClass("selected").css("opacity", 1);
}


// ------------------------------------
// --- Pages states
// ------------------------------------

function setStatePage (type, id) {
  
  // --- manage state

  var oldPage = {
    "type":   state.currentPage.type,
    "id":     state.currentPage.id,
    "depth":  state.currentPage.depth,
  }

  if (type == "area") {
    if (oldPage.type === "area" && oldPage.id === id) {
      type = "home";
    }
  }

  var depths = { "home": 0, "area": 1, "story": 2 };
  var depth = depths[type];
  if (depth === null) {
    throw "Wrong type passed to setter: "+ type;
  }


  // --- manage body classes

  $("body").removeClass("home").removeClass("area").removeClass("story");
  $("body").addClass(type);

  

  // --- manage svg trees

  if (type == "home" && state.selectedTree !== null) {
    
    deselectAllBranches();
    selectTree(null);
  
  } else if (type == "area") {

    deselectAllBranches();
    if (!(oldPage.type === "story" && state.selectedTree === id)) {
      selectTree(id);
    }
  
  } else if (type == "story") {

    var story = state.storiesMap[id];
    console.log("story", story);

    var wait = 0;

    if (story.area !== state.selectedTree) {
      selectTree(story.area);
    }

    // --- branch and cherry

    $("g.tree#"+ story.area +" .branch-g").removeClass("selected").css("opacity", 0.1);
    $("g.tree#"+ story.area +" .branch-g.branch-story").css("opacity", 0.2);

    $(".branch-g#"+ story.area).addClass("selected");
    $(".branch-g#"+ story.area +"---"+ story.level).addClass("selected");
    $(".branch-g#"+ story.area +"---"+ story.level +"---"+ story.sector).addClass("selected");
    $(".branch-g[data-value='"+ story.slug +"']").addClass("selected");

  }



  // --- manage content

  if (type == "home") {

    $("#content").html("");
  
  } else if (type == "area") {
    
    var stories = getAreaStories(state.selectedTree);
    var areaImgUrl = releaseFolder +"/maps-areas/"+ id +".svg";
    var countBy = _.countBy(stories, "sectorCopy");
    var sectors = Object.keys(countBy).map(function(sectorCopy) {
      return { "sectorCopy": sectorCopy, "sector": sectorCopy.slug(), "count": countBy[sectorCopy] };
    });
    var context1 = { 
      "imgSrc": areaImgUrl,
      "sectors": sectors,
    };
    var context2 = { 
      "stories": stories 
    };
    var htmlAreaStats = templates.areaStats(context1);
    var htmlStories = templates.storyPreviews(context2);
    // $("#content").html("<h1 class='font-serif-l'>Area overview: "+ id +"</h1>");
    $("#content").html(htmlAreaStats).append(htmlStories);

  } else if (type == "story") {

    var story = state.storiesMap[id];
    // $("#content").html("<h1 class='font-serif-l'>Story: "+ story.titleCopy +"</h1>");
    var htmlStory = templates.story(story);
    $("#content").html(htmlStory);

  }


  
  // --- manage timeline
  if (type == "home") {

    removeTimeline();

  } else if (type == "area") {

    createTimeline(id);

  } else if (type == "story") {
  
    var story = state.storiesMap[id];
    createTimeline(story.area);

  }



  // --- manage left ui

  /***
  if story
    show title
    show nav
  */

  // --- update state

  state.currentPage = {
    "type":   type,   // ---  home  area      story
    "id":     id,     // ---  null  "europe"  "story-slug-lorem-ipsum"
    "depth":  depth,  // ---  0     1         2
  };

}


function selectTree (id) {

  // deselect

  if (id === null) {
    if (state.selectedTree !== null) {
      var oldId = state.selectedTree;
      trees[oldId].moveInPosition(true);
      setTimeout(function() { showTrees(); }, animms/2);
      state.selectedTree = null;
    }
    updateHeader();
    return;
  }

  if (state.selectedTree !== null) {

    // swap selection

    var oldId = state.selectedTree;
    state.selectedTree = id;
    trees[oldId].hide();
    trees[oldId].svgGroup.removeClass("selected"); // hack
    setTimeout(function() { 
      trees[oldId].moveInPosition(); 
      trees[state.selectedTree].moveLeft();
    }, animms);
    setTimeout(function() { 
      trees[state.selectedTree].show();
    }, animms*2);
  
  } else {
    
    // all > select one

    state.selectedTree = id;
    trees[state.selectedTree].moveLeft(true); 
    hideTrees();
    setTimeout(function() { 
      trees[state.selectedTree].show();
    }, animms*2);
  }

  // toggleBelow(false);
  updateHeader();
}


function updateHeader () {
  $("#header")
    .removeClass("europe")
    .removeClass("north-america")
    .removeClass("asia-oceania")
    .removeClass("latin-america")
    .removeClass("africa");
  if (state.selectedTree){
    $("#header").addClass(state.selectedTree);
  }
}


// function handleStoryClick (slug) {

//   setStatePage("story", slug);

//   // if (state.selectedTree === null || state.selectedTree !== area) {
//   //   selectTree(area);
//   // }
  
// }

// --- Listeners and events

function addListeners () {

  $("svg g.tree .branch-g.branch-story").mouseover(function(e){     
    var area = this.id.split("---")[0];
    var level = this.id.split("---")[1];
    var sector = this.id.split("---")[2];
    if (area == state.selectedTree && state.currentPage.type == "story") {
      $(".branch-g#"+ area).addClass("hovered");
      $(".branch-g#"+ area +"---"+ level).addClass("hovered");
      $(".branch-g#"+ area +"---"+ level +"---"+ sector).addClass("hovered");
      $(this).addClass("hovered");
    }
  });

  $("svg g.tree .branch-g.branch-story").mouseout(function(e){ 
    var area = this.id.split("---")[0];
    var level = this.id.split("---")[1];
    var sector = this.id.split("---")[2];
    if (area == state.selectedTree && state.currentPage.type == "story") {
      $(".branch-g#"+ area).removeClass("hovered");
      $(".branch-g#"+ area +"---"+ level).removeClass("hovered");
      $(".branch-g#"+ area +"---"+ level +"---"+ sector).removeClass("hovered");
      $(this).removeClass("hovered");
    }
  });

  $("svg .branch-story").click(function(e){ 
    e.stopPropagation();
    // handleStoryClick(this.dataset.value);
    var slug = this.dataset.value;
    setStatePage("story", slug);
  });

  $("svg g.tree").click(function(e){ 
    setStatePage("area", this.id);
  });

  $("#header .item").click(function(e) {
    console.log(e)
    var target = (e.target.tagName == "SPAN") ? e.target.parentNode : e.target;
    handleMenuClick(target.dataset.type, target.dataset.value);
  });

  $("#header .logo").click(function(e) {
    setStatePage("home", null);
  });

  $("#to-top").click(function() {
    $("html, body").animate({ "scrollTop": 0 }, animms);
  });

  $("#nav-back").click(function() {
    if (state.currentPage.type == "story") {
      setStatePage("area", state.selectedTree);
    } else if (state.currentPage.type == "area") {
      setStatePage("home", null);
    }
  });
}


function handleMenuClick (type, value) {

  if (type == "area") {

    setStatePage("area", value);

  } else if (type == "anchor") {

    var wait = 0;
    if (state.selectedTree !== null) {
      wait = animms;
    }
    setStatePage("home", null);
    setTimeout(function() {
      var to = $("#"+ value).offset().top;
      $("html, body").animate({ "scrollTop": to }, animms);
    }, wait);
  }
}


// --- Utilities


// WIP
// WIP
// WIP
// WIP
// WIP
// WIP
// WIP
// WIP


function getAreaStories (area) {
  var stories = Object.keys(state.storiesMap)
    .map(function(k) { 
      return state.storiesMap[k]; 
    })
    .filter(function(story) {
      return story.area == area;
    });
  return stories;
}

function createTimeline (area) {
  
  var stories = getAreaStories(area);
  console.log("stories", stories);

  var my = 40;
  var tlg = svg.group().addClass("timeline");
  tlg.line(state.w/2, my, state.w/2, state.h-my).addClass("timeline-skeleton");
  setTimeout(function() {
    tlg.addClass("show");
  }, animms);

}

function removeTimeline () {
  svg.find("g.timeline")
    .removeClass("show")
    .remove();
}


// function toggleBelow (show, callback) {

//   if (!$("#below").hasClass("hide") === show) {
//     if (callback) {
//       callback();
//     }
//     return;
//   }

//   if (show === true) {
//     $("#below").removeClass("hide");
//     if (callback) {
//       callback();
//     }
//   } else if (show === false) {
//     $("html, body").animate({ "scrollTop": 0 }, animms, function() {
//       $("#below").addClass("hide");
//     });
//   } else {
//     throw "show parameter missing.";
//   }
// }


function countChildren (item, sum) {
  currentSum = sum ? sum : 0;
  if (item.children.length == 0) return 1;
  var newSum = 0;
  item.children.forEach(function(c) {
    newSum += countChildren(c, currentSum);
  });
  return newSum + currentSum;
}


function isMobile () {
  var mql = window.matchMedia('(max-width: 991px)');
  return mql.matches;
}


function loadData (file, callback) {
  var middata = {};
  $.getJSON( file, function(jsonData) {

    state.flatData = jsonData;

    // --- mid data structure
  
    for (var i = 0; i < jsonData.length; i++) {
      var d = jsonData[i];
      var area = d.area.slug();
      var level = d.level.slug();
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
            var storyDate = moment(d.date);

            var story = {
              "area":       area,
              "level":      level,
              "sector":     sector,
              "slug":       storySlug,
              "date":       storyDate,
              "areaCopy":   d.area,
              "levelCopy":  d.level,
              "sectorCopy": d.sector,
              "textCopy":   storyText,
              "titleCopy":  storyTitle,
              "dateCopy":   storyDate.format("D MMM YYYY"),
            };
            state.storiesMap[storySlug] = story;

            if (storyDate.isAfter(state.lastDate)) {
              state.lastDate = storyDate;
            }
            if (storyDate.isBefore(state.firstDate)) {
              state.firstDate = storyDate;
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
