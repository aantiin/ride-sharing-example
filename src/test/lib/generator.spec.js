const chai = require('chai');
const assert = require('chai').assert;
const should = require('chai').should();

const expect = chai.expect;
const generator = require('../../lib/generator');

describe('generateOrderNumber', () => {
    describe('generateOrderNumber 1  : #positive', () => {
        const result = generator.generateOrderNumber('zxcfghbj7ghaBG23fgSR');
        it('should not null', () => {
            assert.isNotNull(result);
        });

        it('should return 8 length', () => {
            expect(result.length).to.equal(8);
        });
    });
});
