'use strict';
describe('Agent', function () {
    var agent = new Genev.Agent();
    it('should have a Genome attached', function (done) {
        agent.genome.should.be.an('object');
        done();
    });
    it('extended should have a correct prototype', function(done){
        var extended = Genev.Agent.extend({});

        extended.prototype.step.should.be.a('function');
        expect(extended.prototype.constructor.__super__).to.equal(agent.__proto__);

       done();
    });
    it('should decode/encode correctly', function(done){
        var obj = agent.toJSON(),
            attr = ['dir', 'gen', 'genTime1', 'genTime2', 'delay', 'stop'],
            testAgent = _.isEqual(_.pick(agent, attr), _.pick(new Genev.Agent(obj), attr));
        expect(testAgent)
        done();
    });
});