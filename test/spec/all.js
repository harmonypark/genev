'use strict';

describe('Genome', function () {
    var genome = new Genev.Genome();
    it('clone chould have same properties', function (done){
        var clone = genome.clone();
        for(var key in clone){
            if(clone[key] instanceof Array && clone.hasOwnProperty(key)){
                clone[key].forEach(function(v, idx, arr){
                    expect(v).to.equal(genome[key][idx]);
                });
            }
        }
        done();
    });
    it('decoding and encoding to Genome string should be produce exact copy', function (done) {
        var encoded = genome.toGenomeString(),
            decoded = new Genev.Genome(encoded);
        for(var key in decoded){
            if(decoded[key] instanceof Array && decoded.hasOwnProperty(key)){
                decoded[key].forEach(function(v, idx, arr){
                    expect(v).to.equal(genome[key][idx]);
                });
            }
        }
        done();
    });
});
describe('Agent', function () {
    var agent = new Genev.Agent();
    it('should have a Genome attached', function (done) {
        agent.genome.should.be.an('object');
        done();
    });
    it('decoding and encoding to Genome string should be produce exact copy', function (done){
        var encoded = agent.toGenomeString(),
            decoded = new Genev.Agent(encoded),
            val;
        for(var key in agent.attributes){
            val = decoded.key;
            if(typeof val === "object"){
                expect(_.isEqual(val, agent.key)).to.equal(true);
            } else {
                expect(val).to.equal(agent.key);
            }
        }
        done();
    });
});
describe('Individual', function () {
    var individual = new Genev.Individual();

    it('should retain consistent hsb matrix at every step', function(done){
        var h, s, b;

        individual.step();

        h = matrixReduce(individual.h);
        s = matrixReduce(individual.s);
        b = matrixReduce(individual.b);

        function matrixReduce( mx ) {
            return _.reduce(mx, function(memo, val){
                return memo + _.reduce(val, function(memo, val){
                    return memo + val;
                }, 0);
            }, 0);
        }

        expect(isNaN(h)).to.equal(false);
        expect(isNaN(s)).to.equal(false);
        expect(isNaN(b)).to.equal(false);

        done();
    });

});
