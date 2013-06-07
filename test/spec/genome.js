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
    it('extended should have a correct prototype', function(done){
        var extended = Genev.Genome.extend({});

        extended.prototype.clone.should.be.a('function');
        expect(extended.prototype.constructor.__super__).to.equal(genome.__proto__);

       done();
    });
});