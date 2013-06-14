'use strict';
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

    it('extended should have a correct prototype', function(done){
        var extended = Genev.Individual.extend({
            defaults: {
                wrapAround: false,
                width: 100,
                height: 100
            },
        });

        extended.prototype.step.should.be.a('function');
        expect(extended.prototype.constructor.__super__).to.equal(individual.__proto__);

       done();
    });
    it('should decode/encode to JSON correctly', function(done){
        var json = individual.toJSON();
        expect(individual.fromJSON(json).toJSON() === json).to.equal(true);
        done();
    });


});