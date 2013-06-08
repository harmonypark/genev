'use strict';
describe('Genome', function () {
    var genome = new Genev.Genome();
    it('clone chould have same properties', function (done){
        var clone = genome.clone();
        for(var key in clone){
            if(clone[key] instanceof Array || clone[key] instanceof Uint8Array || clone[key] instanceof Float32Array && clone.hasOwnProperty(key)){
                for(var i = 0; i < genome[key].length; ++i){
                    expect(clone[key][i]).to.equal(genome[key][i]);
                }
            }
        }
        done();
    });
    it('decoding and encoding to Genome string should be produce exact copy', function (done) {
        var encoded = genome.toGenomeString(),
            decoded = new Genev.Genome(encoded);
        for(var key in decoded){
            if(decoded[key] instanceof Array || decoded[key] instanceof Uint8Array || decoded[key] instanceof Float32Array && decoded.hasOwnProperty(key)){
                for(var i = 0; i < genome[key].length; ++i){
                    expect(decoded[key][i]).to.equal(genome[key][i]);
                }
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