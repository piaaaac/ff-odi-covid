/* -------------------------------------

To do

- Svg group for each tree

- Circle under each tree

------------------------------------- */

var cnt = document.getElementById("container");

var state = {
  loadingData: true,
  data: {},
  logp: null,
  p5setupDone: false,
  p5Finished: false,
  w: cnt.offsetWidth,
  h: cnt.offsetHeight,
};

setupLogP();

loadData("data/all.json", function (fullTreeData) {
  state.data = fullTreeData;
  console.log("state.data", state.data);
  state.loadingData = false;
  state.logp.innerText = "data loaded.";
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
    "fill": "#B92E6C",
    "stroke": "#E7E5F1",
    "stroke-width": 1,
  },
  "friut-selected": {
    "fill": "none",
    "stroke": "#B92E6C",
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
    .addClass("branch-g")
    .attr("id", props.id)
    .data(props);
  if (props.dimension == "story") {
    g.addClass("story");
  }
  var additionalStyle = {
    "stroke-width": (props.depth < 3) ? 2 : (props.depth == 3) ? 0.7 : 0.5,
    "stroke": (props.depth <= 3) ? "#000" : "#B92E6C",
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
    g.circle(csize2).attr(svgStyles["friut-selected"]).addClass("selected").attr({ cx: x, cy: y });
  }
  return g;
}


// ----------------------------------------------
// P5
// ----------------------------------------------

var trees = {
  "north-america": null,
  "south-america": null,
  "europe": null,
  "africa": null,
  "asia": null,
  "oceania": null,
};
// var tf = new Transformer();
var len0 = 70;

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
    var b = new Branch (data.children, null, len0, randomAngle(PI/15), data.props);
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
  this.svgGroup = svg.group().addClass("tree").attr({ id: branch0.props.id });
  this.drawn = false;
 
  // methods essential to construct

  this.addBranch = function (b) {
    b.attachTo(this);
    this.branches.push(b);
  }
  
  // finish to construct
  
  this.addBranch(branch0);

  // other methods --- draw

  this.complete = function () {
    this.drawn = true;
    this.rootPoint = {};
    this.rootPoint.x = this.svgGroup.bbox().x;
    this.rootPoint.y = this.svgGroup.bbox().y;
  }

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
    var a = animate || false;

    // var rootBranch = this.svgGroup.findOne(".branch-area");
    // if (!rootBranch.hasOwnProperty("_array")) {
    //   this.svgGroup.dmove(0, 0);
    // }
    // var origin = [rootBranch._array[0][1], rootBranch._array[0][2]];

    if (a) {
      this.svgGroup.animate().move(x + this.rootPoint.x, y + this.rootPoint.y);
    } else {
      this.svgGroup.move(x + this.rootPoint.x, y + this.rootPoint.y);
    }
  }

  this.moveCenter = function (x, y, animate) {
    var a = animate || false;

    if (a) {
      this.svgGroup.animate().move(x - this.svgGroup.bbox().w/2, y - this.svgGroup.bbox().h/2);
    } else {
      this.svgGroup.move(x - this.svgGroup.bbox().w/2, y - this.svgGroup.bbox().h/2);
    }
  }

  this.select = function () {
    
    // console.log(this.svgGroup.bbox());

    this.moveCenter(state.w*0.25, state.h/2, true);
    // this.svgGroup.animate().move(100, 100);


    // SVG.find("group.tree:not(#"+ groupNode.id +")").animate().attr({ opacity: 0 });
    // SVG.find(".tree#"+ id).animate().attr({ opacity: 0 });
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
        
        // --- V1
        // var newLen = this.len*0.66 * map(random(), 0,1, 0.9, 1.1);
        // var availableAngle = PI*0.8; // PI = 180°
        
        // --- V2
        var dimension = this.children[i].props.dimension;
        var newLen = (dimension == "area") ? len0 * 0.2
          : (dimension == "level") ? len0 * 1.6
          : (dimension == "sector") ? len0 * 0.5
          : len0 * 0.4; // story
        var newLen = newLen * map(random(), 0,1, 0.9, 1.1);
        var availableAngle = PI*0.5; // PI = 180°

        var startAngle = -availableAngle/2;
        var newRelAngle = startAngle + availableAngle*normAngles[i];
        var newAngle = this.angle + newRelAngle; //randomAngle(PI/5);
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
    var angle1 = random() > 0.5 ? angle : -angle;
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


function initialize () {
  var x1 = state.w * 0.20;
  var x2 = state.w * 0.50;
  var x3 = state.w * 0.80;
  var y1 = state.h * 0.45;
  var y2 = state.h * 0.90;
  
  trees["north-america"].moveRoot(x1, y1);
  trees["europe"].moveRoot(x2, y1);
  trees["asia"].moveRoot(x3, y1);
  trees["south-america"].moveRoot(x1, y2);
  trees["africa"].moveRoot(x2, y2);
  trees["oceania"].moveRoot(x3, y2);
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

function addListeners () {

  $("svg .branch-g").mouseover(function(e){ 
    // this.instance.find(".branch-path").animate(200).attr(svgStyles.hover);
    this.instance.find(".selected").attr({ opacity: 1 });
    state.logp.innerText = this.dataset.value.toUpperCase();
  });

  $("svg .branch-g").mouseout(function(e){ 
    // this.instance.find(".branch-path").animate(200).attr(svgStyles.normal);
    this.instance.find(".selected").attr({ opacity: 0 });
    state.logp.innerText = "";
  });

  $("svg .branch-g").click(function(e){ 
    e.stopPropagation();
    console.log(this.dataset.id);
  });

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
            var props = $.extend({}, d, {
              "id": area +"---"+ level +"---"+ sector +"---"+ di,
              "depth": 4,
              "dimension": "story",
              "value": level +" story about "+ sector +" in "+ area +" - "+ di,
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
