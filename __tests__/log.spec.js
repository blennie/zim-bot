/***************************************************************************************************************************************************************
 *
 * Log unit tests
 *
 **************************************************************************************************************************************************************/


const Drips = require('../index.js');
const Style = Drips.Style;


test('Drips.[type] - should begin with the right flag', () => {
	console.log = jest.fn();
	console.info = jest.fn();
	console.error = jest.fn();

	Drips.banner('banner'); // log
	Drips.error('error');   // error
	Drips.info('info');     // info
	Drips.ok('ok');         // log
	Drips.done('done');     // log

	expect( console.log.mock.calls.length ).toBe( 3 );
	expect( console.info.mock.calls.length ).toBe( 1 );
	expect( console.error.mock.calls.length ).toBe( 1 );

	expect( Style.strip( console.log.mock.calls[0][0] ).startsWith( Drips.flags.banner ) ).toBeTruthy();
	expect( Style.strip( console.log.mock.calls[0][0] ).endsWith('banner') ).toBeTruthy();

	expect( Style.strip( console.error.mock.calls[0][0] ).startsWith( Drips.flags.error ) ).toBeTruthy();
	expect( Style.strip( console.error.mock.calls[0][0] ).endsWith('error') ).toBeTruthy();

	expect( Style.strip( console.info.mock.calls[0][0] ).startsWith( Drips.flags.info ) ).toBeTruthy();
	expect( Style.strip( console.info.mock.calls[0][0] ).endsWith('info') ).toBeTruthy();

	expect( Style.strip( console.log.mock.calls[1][0] ).startsWith( Drips.flags.ok ) ).toBeTruthy();
	expect( Style.strip( console.log.mock.calls[1][0] ).endsWith('ok') ).toBeTruthy();

	expect( Style.strip( console.log.mock.calls[2][0] ).startsWith( Drips.flags.done ) ).toBeTruthy();
	expect( Style.strip( console.log.mock.calls[2][0] ).endsWith('done') ).toBeTruthy();

});


test('Drips.verbose - should log nothing with verboseMode false', () => {
	console.log = jest.fn();

	Drips.verboseMode = false;

	Drips.verbose(`test`);
	Drips.verbose(`test2`);

	expect( console.log.mock.calls.length ).toBe( 0 );
});


test('Drips.verbose - should log with verboseMode true', () => {
	console.log = jest.fn();

	Drips.verboseMode = true;

	Drips.verbose(`test`);
	Drips.verbose(`test2`);

	expect( console.log.mock.calls.length ).toBe( 2 );

	expect( Style.strip( console.log.mock.calls[0][0] ).startsWith( Log.flags.verbose ) ).toBeTruthy();
	expect( Style.strip( console.log.mock.calls[0][0] ).endsWith('test') ).toBeTruthy();

	expect( Style.strip( console.log.mock.calls[1][0] ).startsWith( Log.flags.verbose ) ).toBeTruthy();
	expect( Style.strip( console.log.mock.calls[1][0] ).endsWith('test2') ).toBeTruthy();
});


test('Drips.time - should log its message', () => {
	console.log = jest.fn();

	Drips.time(`test`);
	Drips.time(`test2`);

	expect( console.log.mock.calls.length ).toBe( 2 );

	expect( Style.strip( console.log.mock.calls[0][0] ).endsWith('test') ).toBeTruthy();
	expect( Style.strip( console.log.mock.calls[1][0] ).endsWith('test2') ).toBeTruthy();
});


test('Drips.hr - should log a long line', () => {
	console.log = jest.fn();

	Drips.hr( 10 );

	expect( console.log.mock.calls.length ).toBe( 1 );

	expect( Style.strip( console.log.mock.calls[0][0] ).startsWith('\n ') ).toBeTruthy();
	expect( Style.strip( console.log.mock.calls[0][0] ).endsWith(' \n') ).toBeTruthy();
	expect( Style.strip( console.log.mock.calls[0][0] ) ).toBe('\n ════════ \n');
});
