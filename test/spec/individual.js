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

});