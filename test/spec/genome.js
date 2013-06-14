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
    it('extended should have a correct prototype', function(done){
        var extended = Genev.Genome.extend({});
        extended.prototype.clone.should.be.a('function');
        expect(extended.prototype.constructor.__super__).to.equal(genome.__proto__);
        done();
    });
    it('should decode/encode correctly', function(done){
        var obj = genome.toJSON(),
            test = _.isEqual(genome, new Genev.Genome(obj)); 

        expect(test).to.equal(true);
        done();
    });
});