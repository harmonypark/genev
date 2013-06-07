//    Genev.js 0.0.1
//    Original code from from http://www.csse.monash.edu.au/~cema/evoeco/
//    Ported by Jokubas Dargis jokubas@harmonypark.net
'use strict';
(function(root, factory) {

  if (typeof exports !== 'undefined') {
    factory(root, exports, require('underscore'));
  } else if (typeof define === 'function' && define.amd) {
    define(['underscore', 'exports'], function(_, exports) {
      root.Genev = factory(root, exports, _);
    });
  } else {
    root.Genev = factory(root, {}, root._);
  }
} (this, function(root, Genev, _) {

  Genev.VERSION = '0.0.1';

  // Global default values
  // ---------------------

  //
  // TODO: description
  //

  var config = {
    'useColor': true,
    'useSaturation': true,
    'worldWidth': 270,
    'worldHeight': 160,
    'maxAgents': 10,
    'minAgents': 5,
    'agentTreeDepth': 3,
    'agentInputs': 27, // Agent's collected inputs length - IMPORTANT: need to ensure it correct lenght otherwise we fail
    'biasHTree': false,
    'biasSTree': false,
    'biasBTree': false,
    'biasNoChange': false
  };

  // Frequently used functions accros Genev
  // --------------------------------------

  var utils = {
    gaussRandom: function () {
      var x1, x2, rad, y1;
      do {
        x1 = 2 * Math.random() - 1;
        x2 = 2 * Math.random() - 1;
        rad = x1 * x1 + x2 * x2;
      } while(rad >= 1 || rad === 0);
      var c = Math.sqrt(-2 * Math.log(rad) / rad);
      return x1 * c;
    },
    limit: function ( x, min, max ) {
      if( x < min ) {
        return min;
      } else if( x > max) {
        return max;
      } else {
        return x;
      }
    },
    ringify: function ( x ) {
      if( x > 1 ) {
        return x - 1;
      } else if( x < 0) {
        return 1 + x;
      } else {
        return x;
      }
    },
    probFn: function ( val, prob, fx, fy ) {
      var args = Array.prototype.slice.call(arguments),
        extraArgs,
        prob = prob || 0;
      if(args.length > 4){
        extraArgs = args.slice(4);
        extraArgs.unshift(val);
      }
      return (Math.random() < prob) ? ((!extraArgs) ? fx(val) : fx.apply(null, extraArgs)) : ((!extraArgs) ? fy(val) : fy.apply(null, extraArgs));
    },
    parseBoolean: function( value ){
      return (value === 'true') ? true : false;
    },
    populateArray: function(size, val) {
      return _.map(new Float32Array(size), function(){
        if(val instanceof Array){
          return new Float32Array(val);
        } else {
          return val;
        }
      });
    },
    generateMatrix: function(cols, rows, val){
      return this.populateArray(cols, this.populateArray(rows, val));
    },
    probab: function( prob, fn ){
      fn = fn || Math.random;
      return fn() < prob;
    },
    hsvToRgb: function(h, s, v){
      var r, g, b, i, f, p, q, t;

      if(s === 0){
        r = g = b = v;
        return[Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
      }

      h *= 6;
      i  = Math.floor(h);
      f = h - i;
      p = v *  (1 - s);
      q = v * (1 - s * f);
      t = v * (1 - s * (1 - f));
      switch( i ) {
        case 0:
          r = v;
          g = t;
          b = p;
          break;
        case 1:
          r = q;
          g = v;
          b = p;
          break;
        case 2:
          r = p;
          g = v;
          b = t;
          break;
        case 3:
          r = p;
          g = q;
          b = v;
          break;
        case 4:
          r = t;
          g = p;
          b = v;
          break;
        default:
          r = v;
          g = p;
          b = q;
          break;
      }
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
  };

  var noop = function(){};


  // Genev.Individual
  // ----------------

  //
  // TODO: description
  //

  var Individual = Genev.Individual = function( attributes ){

    var defaults,
        args = Array.prototype.slice.call(arguments),
        stringChunks;

    if (defaults = _.result(this, 'defaults')) {
        _.extend(this, defaults);
    }

    if(typeof attributes !== 'string'){
      _.extend(this, attributes);
    }

    if(typeof args[0] === 'string'){
      stringChunks =  args[0].split('::');
      this.numAgents = parseInt(stringChunks[0]);
      this.width = parseInt(stringChunks[1]);
      this.height = parseInt(stringChunks[2]);
      this.wrapAround = utils.parseBoolean(stringChunks[3]);
      this.startH = parseFloat(stringChunks[4]);
      this.startS = parseFloat(stringChunks[5]);
      this.startB = parseFloat(stringChunks[6]);
      this.agents = [];
      for (var i = 0; i < this.numAgents; ++i){
        this.agents[i] = new Agent(stringChunks[7 + i]).setIndex(i);
      }
    } else {
      this.startH = this.startH || Math.random();
      this.startS = this.startS || Math.random();
      this.startB = this.startB || Math.random();
      this.numAgents = this.numAgents || Math.round(Math.random() * (config['maxAgents'] - config['maxAgents']) + config['maxAgents']);
      this.agents = this.agents || this.generateAgents(this.numAgents, this.width, this.height, this.wrapAround);
    }

    this.maxTime = 2 * this.width * this.height;
    this.time = 0;
    this.developed = false;
    this.h = utils.generateMatrix(this.width, this.height, this.startH);
    this.s = utils.generateMatrix(this.width, this.height, this.startS);
    this.b = utils.generateMatrix(this.width, this.height, this.startB);
    _.each(this.agents, function(agent){
      agent.wrapAround = this.wrapAround;
    }, this);

    this.initialize.apply(this, arguments);

    return this;
  };

  _.extend(Individual.prototype, {

    defaults: {
      wrapAround: true,
      width: 1024,
      height: 768
    },

    initialize: noop,

    generateAgents: function( number, width, height, wrapAround ){
      number = number || this.numAgents;
      width = width || this.width;
      height = height || this.height;
      wrapAround = wrapAround || this.wrapAround;
      var self = this;
      return _.map(_.range(number), function(v, i, l){
        return new Agent({
          index: i,
          width: width,
          height: height,
          wrapAround: wrapAround
        });
      });
    },

    step: function() {
      var res, pos;
      if(this.developed){
        return this;
      } else {
        ++this.time;
        _.each(this.agents, function(agent){
          res = agent.step(this, this.time);
          if(res){
            pos = res.currPos();
            this.h[pos.x][pos.y] = res.h;
            this.s[pos.x][pos.y] = res.s;
            this.b[pos.x][pos.y] = res.b;
            res.nextPos();
          }
        }, this);
        if(this.time >= this.maxTime) {
          this.developed = true;
        }
        return this;
      }
    },

    clone: function() {
      var newAgents = _.map(_.range(this.numAgents), function(v, i, l){
        return this.agents[i].clone().setIndex(i);
      }, this);
      return new Individual({
        width: this.width,
        height: this.height,
        wrapAround: this.wrapAround,
        numAgents: this.numAgents,
        startH: this.startH,
        startS: this.startS,
        startB: this.startB,
        agents: newAgents
      });
    },

    mutate: function( prob ) {
      var self = this,
          newNumAgents = this.numAgents,
          newAgents = [], replace, swap,
          newWrapAround = this.wrapAround,
          newStartColors = _.map([this.startH, this.startS, this.startB], function(v, i, l){
            return (utils.probab(prob)) ? utils.ringify(l[i] + utils.gaussRandom()) : l[i];
          });

      if((utils.probab(2 * prob)) && (this.numAgents < (config['maxAgents']) - 1)){
        ++newNumAgents;
        newAgents = _.map(_.range(newNumAgents - 1), function(v, i, l){
          return this.agents[i].clone().setIndex(i);
        }, this);
        replace = newNumAgents - 1;
        if(utils.probab(0.75)){
          newAgents[replace] = new Agent({
            index: replace,
            width: this.width,
            height: this.height,
            wrapAround: this.wrapAround
          });
        } else {
          swap = Math.floor(Math.random() * replace);
          newAgents[newNumAgents - 1] = this.agents[swap].clone().setIndex(replace);
        }
      } else if ((utils.probab(2 * prob)) && (this.numAgents > config['minAgents'])){
        --newNumAgents;
        newAgents = _.map(_.range(newNumAgents), function(v, i, l){
          return this.agents[i].clone().setIndex(i);
        }, this);
        swap = Math.floor(Math.random() * newNumAgents);
        newAgents[swap] = this.agents[newNumAgents].clone().setIndex(swap);
      } else {
        newAgents = _.map(_.range(newNumAgents), function(v, i, l){
          return this.agents[i].clone().setIndex(i);
        }, this);
      }

      return new Individual({
        width: this.width,
        height: this.height,
        wrapAround: newWrapAround,
        numAgents: newNumAgents,
        startH: newStartColors[0],
        startS: newStartColors[1],
        startB: newStartColors[2],
        agents: newAgents
      });
    },

    crossover: function( individual ) {
      var newNumAgents = (utils.probab(0.5)) ? individual.numAgents : this.numAgents,
        newWrapAround = (utils.probab(0.5)) ? individual.wrapAround : this.wrapAround,
        newH = (utils.probab(0.5)) ? individual.startH : this.startH,
        newS = (utils.probab(0.5)) ? individual.startS : this.startS,
        newB = (utils.probab(0.5)) ? individual.startB : this.startB,
        newAgents, cross;

      newAgents = _.map(_.range(newNumAgents), function(v, i, l){
        if(utils.probab(0.33)) {
          return this.agents[Math.floor(Math.random()* this.numAgents)].clone().setIndex(i);
        } else if(utils.probab(0.5)) {
          cross = individual.agents[Math.floor(Math.random()* individual.numAgents)];
          return this.agents[Math.floor(Math.random()* this.numAgents)].crossover(cross).setIndex(i);
        } else {
          return this.agents[Math.floor(Math.random()* this.numAgents)].clone().setIndex(i);
        }
      }, this);

      return new Individual({
        width: this.width,
        height: this.height,
        wrapAround: newWrapAround,
        numAgents: newNumAgents,
        startH: newH,
        startS: newS,
        startB: newB,
        agents: newAgents
      });
    },

    toGenomeString: function() {
      var out = this.numAgents + '::' +
          this.width + '::' +
          this.height + '::' +
          this.wrapAround + '::' +
          this.startH + '::' +
          this.startS + '::' +
          this.startB + '::';

      for(var i = 0; i < this.numAgents; ++i){
        out += this.agents[i].toGenomeString() + '::';
      }
      return out;
    }

  });

  // Genev.Agent
  //------------

  //
  // TODO: description
  //

  var Agent = Genev.Agent = function( attributes ){
    var defaults,
        attributes = attributes || {},
        args = Array.prototype.slice.call(arguments),
        stringChunks;


    if (defaults = _.result(this, 'defaults')) {
      _.extend(this, defaults);
    }

    this.genome = new Genome();

    _.extend(this, this._randomizedAttributes());

    if(args.length === 1) {
      if(typeof args[0] === 'string'){
        stringChunks = args[0].split('#');
        if(stringChunks && stringChunks.length === 8){
          this.dir = parseInt(stringChunks[0]);
          this.gen = parseFloat(stringChunks[1]);
          this.genTime1 = parseFloat(stringChunks[2]);
          this.genTime2 = parseFloat(stringChunks[3]);
          this.delay = parseFloat(stringChunks[4]);
          this.stop = parseFloat(stringChunks[5]);
          this.genome = new Genome(stringChunks[6]);
        }
      } else {
        _.extend(this, attributes);
      }
    }

    _.extend(this, this._randomizedGridIndex());

    this._originalAttributes = _.clone(this);

    this.initialize.apply(this, arguments);

    return this;
  };

  _.extend(Agent.prototype, {

    defaults: {
      x: 0,
      y: 0,
      dir: 0,
      delay: 0,
      delayInt: 0,
      stop: 1,
      stopInt: 99999999,
      gen: 0,
      genTime1: 0,
      genTime2: 0,
      wrapAround: true,
      width: 100,
      height: 100,
      index: 1
    },

    initialize: noop,

    setIndex: function(index){
      this.index = index;
      _.extend(this, this._randomizedAttributes());
      return this;
    },

    mutate: function( prob ) {
      var newDir = (Math.random() < prob) ? Math.floor(Math.random() * 9) : this._originalAttributes.dir,
        newGen = (Math.random() < prob) ? (utils.ringify(this.gen + utils.gaussRandom() * 0.2)) : this.gen,
        newGenTime1 = (Math.random() < prob) ? (utils.ringify(this.genTime1 + utils.gaussRandom() * 0.2)) : this.genTime1,
        newGenTime2 = (Math.random() < prob) ? (utils.ringify(this.genTime2 + utils.gaussRandom() * 0.2)) : this.genTime2,
        newDelay = (Math.random() < prob) ? utils.ringify(this.delay + utils.gaussRandom() * 0.1) : this.delay,
        newStop = (Math.random() < prob) ? utils.ringify(this.stop + utils.gaussRandom() * 0.1) : this.stop,
        temp;

      if(newStop < newDelay){
        temp = newDelay;
        newDelay = newStop;
        newStop = temp;
      }

      return new Agent({
        x: this.x,
        y: this.y,
        wrapAround: this.wrapAround,
        genome: this.genome.mutate( prob ),
        dir: newDir,
        gen: newGen,
        genTime1: newGenTime1,
        genTime2: newGenTime2,
        delay: newDelay,
        stop: newStop
      });
    },

    crossover: function( agent ) {
      var prob = 0.5,
        newGen = (Math.random() < prob) ? agent.gen : this.gen,
        newGenTime1 = (Math.random() < prob) ? agent.genTime1 : this.genTime1,
        newGenTime2 = (Math.random() < prob) ? agent.genTime2 : this.genTime2,
        newDelay = (Math.random() < prob) ? agent.delay : this.delay,
        newStop = (Math.random() < prob) ? agent.stop : this.stop;

      return new Agent({
        x: this.x,
        y: this.y,
        wrapAround: this.wrapAround,
        genome: this.genome.crossover( agent.genome ),
        dir: this._originalAttributes.dir,
        gen: newGen,
        genTime1: newGenTime1,
        genTime2: newGenTime2,
        delay: newDelay,
        stop: newStop
      });
    },

    step: function( individual, time ) {
      if( time < this.delayInt || time > this.stopInt) {
        return;
      }
      var inputs = this.collectInputs( individual, time ),
        response = this.genome.evaluate( inputs ),
        nextPos = this._getNextPosition( this._floatToDir( response[3] ) ),
        changing =  {
                nextPos: _.partial( _.bind(
                    function(pos){
                      this.x = pos.x;
                      this.y = pos.y;
                      return pos;
                    }, this),
                  nextPos),
                currPos: _.partial( function( agent ){
                      return {x: agent.x, y: agent.y}
                    }, this),
                h: response[0],
                s: response[1],
                b: response[2]
              };
      return changing;
    },

    collectInputs: function(individual, time) {
      var bMean = 0.0, bMax = 0.0, bMin = 1.0,
        sMean = 0.0,
        hMean = 0.0,
        maxTimeLoop1 = 1000 * this.genTime1,
        maxTimeLoop1 = (maxTimeLoop1 < 1) ? 1 : maxTimeLoop1,
        maxTimeLoop2 = 1000 * this.genTime2,
        maxTimeLoop2 = (maxTimeLoop2 < 1) ? 1 : maxTimeLoop2,
        loopTime1 = time % maxTimeLoop1 / maxTimeLoop1,
        loopTime2 = time % maxTimeLoop2 / maxTimeLoop2,
        dirWhiteWithBlackNbh = -1.0,
        dirBlackWithWhiteNbh = -1.0,
        dRandBright = -1.0,
        dRandDark = -1.0,
        dirWhiteWithBlackNbh2 = 0.0,
        dirBlackWithWhiteNbh2 = 0.0,
        rand = Math.random(),
        bCurr = individual.b[this.x][this.y],
        sCurr = individual.s[this.x][this.y],
        hCurr = individual.h[this.x][this.y],
        oppDir = this._inverseDirection(this.dir),
        dP = this._dirToFloat(oppDir),
        prevPos = this._getNextPosition(oppDir),
        bPrev = individual.b[prevPos.x][prevPos.y],
        sPrev = individual.s[prevPos.x][prevPos.y],
        hPrev = individual.h[prevPos.x][prevPos.y],
        dirBMax = 0,
        dirBMin = 0,
        maxDiff = -1.0,
        dirMaxDiff = 0,
        nbPos, hVal, sVal, bVal, currDiff, dBMax, dBMin, dMaxDiff, threshNbhd = new Array(9), die1, die2, n1, n2;

      for (var i = 0; i < 9; ++i) {
        nbPos = this._getNextPosition(i, this.attributes);
        hVal = individual.h[nbPos.x][nbPos.y];
        sVal = individual.s[nbPos.x][nbPos.y];
        bVal = individual.b[nbPos.x][nbPos.y];

        hMean += hVal;
        sMean += sVal;
        bMean += bVal;

        currDiff = Math.pow(hVal - bCurr, 2) + Math.pow(sVal - sCurr, 2) + Math.pow(bVal - bCurr, 2);

        if(currDiff > maxDiff){
          maxDiff = currDiff;
          dirMaxDiff = i;
        }
        if ( bVal > bMax ) {
          bMax = bVal;
          dirBMax = i;
        }
        if ( bVal < bMin ) {
          bMin = bVal;
          dirBMin = i;
        }
      }

      bMean /= 9.0;
      sMean /= 9.0;
      hMean /= 9.0;
      dBMax = this._dirToFloat(dirBMax);
      dBMin = this._dirToFloat(dirBMin);
      dMaxDiff = this._dirToFloat(dirMaxDiff);

      for (var i = 0; i < 8; ++i) {
        nbPos = this._getNextPosition(i, this.attributes);
        bVal = individual.b[nbPos.x][nbPos.y];
        if(bVal >= bMean) {
          threshNbhd[i] = true;
        }
      }

      for (var i = 0; i < 8; ++i) {
        die1 = Math.random();
        die2 = Math.random();
        n1 = i - 1;
        n1 = (n1 < 1) ? 7 : n1;
        n2 = i + 1;
        n2 = (n2 >= 8) ? 1 : n2;

        if (threshNbhd[i]) {
          if ( dRandBright < 0.0 || die1 < 0.3 ) {
            dRandBright = this._dirToFloat(i);
          }
          if ((threshNbhd[n1] === 0|| threshNbhd[n2] === 0) && (dirBlackWithWhiteNbh < 0.0 || die2 < 0.3)) {
            dirBlackWithWhiteNbh = this._dirToFloat(i);
            dirBlackWithWhiteNbh2 = dirBlackWithWhiteNbh;
          }
        } else {
          if (dRandDark < 0.0 || die1 < 0.3) {
            dRandDark = this._dirToFloat(i);
          }
          if((threshNbhd[n1] !== 0 || threshNbhd[n2] !== 0) && (dirWhiteWithBlackNbh < 0.0 || die2 < 0.3)) {
            dirWhiteWithBlackNbh = this._dirToFloat(i);
            dirWhiteWithBlackNbh2 = dirWhiteWithBlackNbh;
          }
        }
      }

      dRandBright = (dRandBright < 0.0) ? this.gen : dRandBright;
      dRandDark = (dRandDark < 0.0) ? this.gen : dRandDark;
      dirWhiteWithBlackNbh = (dirWhiteWithBlackNbh < 0) ? this.gen : dirWhiteWithBlackNbh;
      dirBlackWithWhiteNbh = (dirBlackWithWhiteNbh < 0) ? this.gen : dirBlackWithWhiteNbh;

      return [ rand, bCurr, bMean, bMax, bMin, dBMin, bPrev, sCurr, sMean, sPrev, hCurr, hMean, hPrev, dP, dMaxDiff, dRandBright, dRandDark, this.gen, loopTime1, loopTime2, dirWhiteWithBlackNbh, dirBlackWithWhiteNbh, individual.startH, individual.startS, individual.startB, dirWhiteWithBlackNbh2, dirBlackWithWhiteNbh2 ];
    },

    clone: function() {
      return new Agent(this.attributes);
    },

    toPrettyString: function() {

      var out = 'A ' + this.index + ' = {' +
        ' (' + this._originalAttributes.x + ',' + this._originalAttributes.y + '), ' +
        'dir: ' + this._originalAttributes.dir + ', ' +
        'a_g: ' + this.gen + ', ' +
        'a_{t_1}: ' + this.genTime1 + ', ' +
        'a_{t_2}: ' + this.genTime2 + ', ' +
        'a_{start}: ' + this.delay + ', ' +
        'a_{stop}: ' + this.stop + '' + '}';

      return out;
    },

    toGenomeString: function() {

      var out = this._originalAttributes.dir + '#' +
          this.gen + '#' +
          this.genTime1 + '#' +
          this.genTime2 + '#' +
          this.delay + '#' +
          this.stop + '#' +
          this.genome.toGenomeString() + '#';

        return out;
    },

    _randomizedAttributes: function( die ) {
      die = die || Math.random();
      var dir = Math.floor(Math.random() * 9),
        gen = Math.random(),
        genTime1 = Math.random(),
        genTime2 = Math.random(),
        delay = (Math.random() < 0.33) ? 0 : Math.random() * 0.33,
        stop = (Math.random() < 0.33) ? 1 : (Math.random() * 0.66) + 0.33;

      if (die < 0.2) {
        delay = 0;
        stop = Math.random() * 0.5;
      } else if (die < 0.4) {
        delay = (Math.random() * 0.4000000059604645) + 0.3;
        stop = 1;
      }

      return {
        dir: dir,
        gen: gen,
        genTime1: genTime1,
        genTime2: genTime2,
        delay: delay,
        stop: stop
      }
    },

    _randomizedGridIndex: function() {
      var maxTime = this.width * this.height * 2,
        delayInt = Math.round(maxTime * this.delay),
        stopInt = Math.round(maxTime * this.stop),
        root =  Math.sqrt(config['maxAgents']),
        gridX = ((this.index / root) * (config['worldWidth'] / root)) + this.width * 0.1,
        gridY = ((this.index % root) * (config['worldHeight'] / root)) + this.height * 0.1,
        gridX = (gridX >= this.width) ? this.width - (this.width * 0.2) : gridX,
        gridY = (gridY >= this.height) ? this.height - (this.height * 0.2) : gridY,
        x = Math.floor(gridX),
        y = Math.floor(gridY);
      return {
        delayInt: delayInt,
        stopInt: stopInt,
        x: x,
        y: y
      };
    },

    _getNextPosition: function( dir ) {
      var pos = [this.x, this.y],
        wrapAround = this.wrapAround,
        width = this.width,
        height = this.height;

      switch(dir){
        case 1:
          pos[0] -= 1;
          break;
        case 2:
          pos[0] -= 1;
          pos[1] -= 1;
          break;
        case 3:
          pos[1] -= 1;
          break;
        case 4:
          pos[0] += 1;
          pos[1] -= 1;
          break;
        case 5:
          pos[0] += 1;
          break;
        case 6:
          pos[0] += 1;
          pos[1] += 1;
          break;
        case 7:
          pos[1] += 1;
          break;
        case 8:
          pos[0] -= 1;
          pos[1] += 1;
          break;
      }

      pos[0] = (pos[0] < 0) ? ((wrapAround) ? width - 1 : 0) : pos[0];
      pos[0] = (pos[0] >= width) ? ((!wrapAround) ? width - 1 : 0) : pos[0];
      pos[1] = (pos[1] < 0) ? ((wrapAround) ? height - 1 : 0) : pos[1];
      pos[1] = (pos[1] >= height) ? ((!wrapAround) ? height - 1 : 0) : pos[1];

      return {x: pos[0], y: pos[1]};
    },

    _inverseDirection: function( dir ) {
      var newDir;
        if (dir === 0) {
          return 0;
        }
        newDir = (dir + 4) % 8;
        if (newDir === 0) {
          newDir = 8;
        }
       return newDir;
    },

    _dirToFloat: function( dir ) {
      return dir / 9.0;
    },

    _floatToDir: function( val ){
      return parseInt(val * 9.0);
    }

  });

  // Genev.Genome
  //-------------

  //
  // TODO: description
  //

  var attrNames = ['inputsH', 'inputsS', 'inputsB', 'inputsDir', 'nodesH', 'nodesS', 'nodesB', 'nodesDir', 'constArr'],
    ops = {
      add: function( x, y ) {
        return x + y;
      },
      sub: function( x, y) {
        return x - y;
      },
      mult : function( x, y ) {
        return x * y;
      },
      ind : function( x, y, i ) { // TODO: find a better way to get value from constArr
        return this.constArr[i];
      },
      min : function( x, y ) {
        return (x < y) ? x : y;
      },
      max : function( x, y ) {
        return (x > y) ? x : y;
      },
      sin : function( x ) {
        return Math.sin( x );
      },
      id : function( x ) {
        return x;
      },
      mean : function( x, y ) {
        return x + y / 2;
      },
      realmean : function( x, y ) {
        return (x + y) / 2;
      },
      div : function( x, y ) {
        return (y < Number.MIN_VALUE) ? x : Math.round(x / y);
      },
      incdec : function( x, y ){
        return (y > 0.5) ? (x + 0.125) : (x - 0.125);
      },
      inv : function( x ) {
        return 1 - x;
      }
    };


  var Genome = Genev.Genome = function( attributes ){
    var args = Array.prototype.slice.apply(arguments),
        stringChunks,
        chunkCount;

    if(args.length === 1 && args[0] instanceof Array) {
      args = args[0];
    } else if( args.length === 1 && typeof args[0] === 'string' ) {
      stringChunks = args[0].split('!');
    }

    this.numTotalNodes = Math.floor(Math.pow(2, config['agentTreeDepth'] + 1) - 1);
    this.numInputNodes = Math.floor(Math.pow(2, config['agentTreeDepth']));
    this.numProcessNodes = this.numTotalNodes - this.numInputNodes;

    this.inputsH = new Uint8Array(_.invoke(_.range(this.numInputNodes), _.bind(this._getRandomInput, this), config['biasNoChange'], 0, true));
    this.inputsS = new Uint8Array(_.invoke(_.range(this.numInputNodes), _.bind(this._getRandomInput, this), config['biasNoChange'], 1, true));
    this.inputsB = new Uint8Array(_.invoke(_.range(this.numInputNodes), _.bind(this._getRandomInput, this), config['biasNoChange'], 2, true));
    this.inputsDir = new Uint8Array(_.invoke(_.range(this.numInputNodes), _.bind(this._getRandomInput, this), false, 0, true));
    this.nodesH = _.invoke(_.range(this.numProcessNodes), this._getRandomFunction, config['biasNoChange']);
    this.nodesS = _.invoke(_.range(this.numProcessNodes), this._getRandomFunction, config['biasNoChange']);
    this.nodesB = _.invoke(_.range(this.numProcessNodes), this._getRandomFunction, config['biasNoChange']);
    this.nodesDir = _.invoke(_.range(this.numProcessNodes), this._getRandomFunction, false);
    this.constArr = new Float32Array(_.map(_.range(this.numProcessNodes), Math.random));

    if(config['biasHTree'] || config['biasSTree'] || config['biasBTree']) {
      this.constArr[0] = Math.random() * 0.4 + 0.3;
    }
    if(config['biasSTree']) {
      this.nodesS[0] = 'ind';
    }
    if(config['biasBTree']) {
      this.nodesB[0] = 'ind';
    }

    if( stringChunks && stringChunks.length > 0 ) {
      chunkCount = 0;
      for ( var i = 0; i < this.numInputNodes; ++i ) {
        this.inputsH[i] = parseInt(stringChunks[chunkCount]);
        this.inputsS[i] = parseInt(stringChunks[chunkCount + 1]);
        this.inputsB[i] = parseInt(stringChunks[chunkCount + 2]);
        this.inputsDir[i] = parseInt(stringChunks[chunkCount + 3]);
        chunkCount += 4;
      }
      for ( var i = 0; i < this.numProcessNodes; ++i ) {
        this.nodesH[i] = stringChunks[chunkCount];
        this.nodesS[i] = stringChunks[chunkCount + 1];
        this.nodesB[i] = stringChunks[chunkCount + 2];
        this.nodesDir[i] = stringChunks[chunkCount + 3];
        this.constArr[i] = parseFloat(stringChunks[chunkCount + 4]);
        chunkCount += 5;
      }
      return this;
    }

    for(var i = 0; i < args.length; ++i) {
      if(args[i] instanceof Array){
        this[attrNames[i]] = args[i];
      }
    }
    this.initialize.apply(this, arguments);
  };

  _.extend(Genome.prototype, {

    initialize: noop,

    clone: function() {
      return new Genome(
        new Uint8Array(this.inputsH),
        new Uint8Array(this.inputsS),
        new Uint8Array(this.inputsB),
        new Uint8Array(this.inputsDir),
        this.nodesH.slice(0),
        this.nodesS.slice(0),
        this.nodesB.slice(0),
        this.nodesDir.slice(0),
        new Float32Array(this.constArr)
      );
    },
    mutate: function( prob ) {
      var mutant = this.clone();
      mutant.inputsH = _.map(mutant.inputsH, function(val){ return utils.probFn(val, prob, this._getRandomInput, ops.id, false, 0, false);});
      mutant.inputsS = _.map(mutant.inputsS, function(val){ return utils.probFn(val, prob, this._getRandomInput, ops.id, false, 1, false);});
      mutant.inputsB = _.map(mutant.inputsB, function(val){ return utils.probFn(val, prob, this._getRandomInput, ops.id, false, 2, false);});
      mutant.inputsDir = _.map(mutant.inputsDir, function(val){ return utils.probFn(val, prob, this._getRandomInput, ops.id, false, 0, false);});
      mutant.nodesH = _.map(mutant.nodesH, function(val){ return utils.probFn(val, prob, this._getRandomFunction, ops.id, false);});
      mutant.nodesS = _.map(mutant.nodesS, function(val){ return utils.probFn(val, prob, this._getRandomFunction, ops.id, false);});
      mutant.nodesB = _.map(mutant.nodesB, function(val){ return utils.probFn(val, prob, this._getRandomFunction, ops.id, false);});
      mutant.nodesDir = _.map(mutant.nodesDir, function(val){ return utils.probFn(val, prob, function(){ return Math.floor(Math.random() * ops.length);}, ops.id);});
      mutant.constArr = _.map(mutant.constArr, function(val){ return utils.probFn(val, prob, function( val ){ return utils.limit(val + utils.gaussRandom() * 0.2);}, ops.id);});
      return mutant;
    },
    crossover: function( genome ) {
      var prob = 0.5,
        newAttr = _.map(
        this.clone(),
        function(val, key, list){
          return _.map(
            val,
            function(v, index){
              return (Math.random() < prob) ? genome[key][index] : v;
            }
          );
        }
      );
      return new Genome(newAttr);
    },
    evaluate: function( inputs ) {
      var hVals = new Float32Array(this.numTotalNodes),
        sVals = new Float32Array(this.numTotalNodes),
        bVals = new Float32Array(this.numTotalNodes),
        dirVals = new Float32Array(this.numTotalNodes),
        child1Index,
        child2Index;

      for( var i = this.numProcessNodes; i < this.numTotalNodes; i++ ) {
        hVals[i] = inputs[this.inputsH[ i - this.numProcessNodes ]];
        sVals[i] = inputs[this.inputsS[ i - this.numProcessNodes ]];
        bVals[i] = inputs[this.inputsB[ i - this.numProcessNodes ]];
        dirVals[i] = inputs[this.inputsDir[ i - this.numProcessNodes ]];
      }

      for( var i = this.numProcessNodes - 1; i >= 0; i-- ) {
        child1Index = i * 2 + 1;
        child2Index = i * 2 + 2;
        hVals[i] = utils.ringify(ops[this.nodesH[i]].apply(this, [hVals[child1Index], hVals[child2Index], i]));
        sVals[i] = utils.ringify(ops[this.nodesS[i]].apply(this, [sVals[child1Index], sVals[child2Index], i]));
        bVals[i] = utils.ringify(ops[this.nodesB[i]].apply(this, [bVals[child1Index], bVals[child2Index], i]));
        dirVals[i] = utils.ringify(ops[this.nodesDir[i]].apply(this, [dirVals[child1Index], dirVals[child2Index], i]));
      }

      return [hVals[0], sVals[0], bVals[0], dirVals[0]];
    },
    toGenomeString: function() {
      var out = '';
      for( var i = 0; i < this.numInputNodes; ++i ) {
        out += this.inputsH[i] + '!';
        out += this.inputsS[i] + '!';
        out += this.inputsB[i] + '!';
        out += this.inputsDir[i] + '!';
      }
      for( var i = 0; i < this.numProcessNodes; ++i ) {
        out += this.nodesH[i] + '!';
        out += this.nodesS[i] + '!';
        out += this.nodesB[i] + '!';
        out += this.nodesDir[i] + '!';
        out += this.constArr[i] + '!';
      }
        return out;
    },
    _getRandomInput: function( biasNoChange, HSorB, init ) {
      var die = Math.random();
      if( biasNoChange ) {
        if( HSorB === 0 ) {
          if( die < 0.33 ) {
            return 11;
          } else if( die < 0.66 ) {
            return 12;
          } else {
            return 13;
          }
        }
        if( HSorB === 1 ) {
          if( die < 0.33 ) {
            return 8;
          } else if (die < 0.66) {
            return 9;
          } else {
            return 10;
          }
        }
        if ( die < 0.2 ) {
          return 1;
        } else if ( die < 0.4) {
          return 2;
        } else if ( die < 0.6 ) {
          return 3;
        } else if ( die < 0.8 ) {
          return 5;
        } else {
          return 7;
        }
      } else if( init ) {
        return Math.floor( Math.random() * (config['agentInputs'] - 1) + 1 );
      } else {
        return Math.random() * config['agentInputs'];
      }
    },
    _getRandomFunction: function( biasNoChange ) {
      var die = Math.random();
      if( biasNoChange ) {
        if ( die < 0.01 ){
          return 'add';
        } else if( die < 0.02 ) {
          return 'sub';
        } else if( die < 0.03 ) {
          return 'mult';
        } else if( die < 0.04 ) {
          return 'ind';
        } else if ( die < 0.05 ) {
          return 'max';
        } else if ( die < 0.06 ) {
          return 'min';
        } else if ( die < 0.65 ) {
          return 'id';
        } else if ( die < 0.88 ) {
          return 'realmean';
        } else if ( die < 0.8 ) {
          return 'div';
        } else if ( die < 0.98 ) {
          return 'incdec';
        } else if ( die < 0.99 ) {
          return 'sin';
        } else {
          return 'inv';
        }
      } else {
        if ( die < 0.05 ){
          return 'add';
        } else if( die < 0.1 ) {
          return 'sub';
        } else if( die < 0.15 ) {
          return 'mult';
        } else if( die < 0.25 ) {
          return 'ind';
        } else if ( die < 0.3 ) {
          return 'max';
        } else if ( die < 0.35 ) {
          return 'min';
        } else if ( die < 0.6 ) {
          return 'id';
        } else if ( die < 0.82 ) {
          return 'realmean';
        } else if ( die < 0.85 ) {
          return 'div';
        } else if ( die < 0.95 ) {
          return 'incdec';
        } else if ( die < 0.98 ) {
          return 'sin';
        } else {
          return 'inv';
        }
      }
    }
  });

  // Genev.initialize
  //-----------

  //
  // TODO: description
  //

  Genev.initialize = function( options ) {
    _.extend(config, (options || {}));
    return this;
  }

  return Genev;
}));