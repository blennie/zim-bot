/***************************************************************************************************************************************************************
 *
 * Better logging for your node app
 *
 * @repo    - https://github.com/dominikwilkowski/log
 * @author  - Dominik Wilkowski
 * @license - https://raw.githubusercontent.com/dominikwilkowski/log/master/LICENSE (GPL-3.0)
 *
 **************************************************************************************************************************************************************/

'use strict';


const TTY /*: function */ = require('tty');
const OS /*: function */ = require('os');


/**
 * Get the size of the cli window
 * A port from https://github.com/jonschlinkert/window-size
 *
 * @return {object} - An object with width and height
 */
const Size /*: function */ = () /*: object */ => {
	let width /*: number */;
	let height /*: number */;

	if( TTY.isatty( 1 ) ) {
		if( process.stdout.getWindowSize ) {
			width = process.stdout.getWindowSize( 1 )[ 0 ];
			height = process.stdout.getWindowSize( 1 )[ 1 ];
		}
		else if( TTY.getWindowSize ) {
			width = TTY.getWindowSize()[ 1 ];
			height = TTY.getWindowSize()[ 0 ];
		}
		else if( process.stdout.columns && process.stdout.rows ) {
			height = process.stdout.rows;
			width = process.stdout.columns;
		}
	}
	else if( OS.release().startsWith('10') ) {
		const numberPattern /*: object */ = /\d+/g;
		const cmd /*: string */ = 'wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution';
		const code /*: string */ = Spawn.execSync( cmd ).toString('utf8');
		const res /*: array */ = code.match( numberPattern );

		return {
			height /*: number */: ~~res[ 1 ],
			width /*: number */: ~~res[ 0 ],
		};
	}
	else {
		return {
			height /*: void */: undefined,
			width /*: void */: undefined,
		};
	}

	return {
		height /*: number */: height || 0,
		width /*: number */: width || 0,
	};
};


/**
 * Returning ansi escape color codes
 * Credit to: https://github.com/chalk/ansi-styles
 *
 * @type {Object}
 */
const Style /*: object */ = {

	/**
	 * Parse ansi code while making sure we can nest colors
	 *
	 * @param  {string} text  - The text to be enclosed with an ansi escape string
	 * @param  {string} start - The color start code, defaults to the standard color reset code 39m
	 * @param  {string} end   - The color end code
	 *
	 * @return {string}       - The escaped text
	 */
	parse: ( text /*: string */, start /*: string */, end /*: string */ = `39m` ) /*: string */ => {
		if( text !== undefined ) {
			const replace /*: object */ = new RegExp( `\\u001b\\[${ end }`, 'g' ); // find any resets so we can nest styles

			return `\u001B[${ start }${ text.toString().replace( replace, `\u001B[${ start }` ) }\u001b[${ end }`;
		}
		else {
			return ``;
		}
	},

	/**
	 * Strip all ansi codes from a string
	 *
	 * @param  {string} text - The text to be cleaned
	 *
	 * @return {string}      - The cleand text
	 */
	strip: ( text /*: string*/ ) /*: string */ => {
		const pattern /*: string */ = [
			'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
			'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'
		].join('|');
		const ansi /*: object */ = new RegExp(pattern, 'g');

		if( typeof text === 'string' ) {
			return text.replace( ansi, '' );
		}
		else {
			return text;
		}
	},

	/**
	 * Style a string with ansi escape codes
	 *
	 * @param  {string} text - The string to be wrapped
	 *
	 * @return {string}      - The string with opening and closing ansi escape color codes
	 */
	black:   ( text /*: string */ ) /*: string */ => Style.parse( text, `30m` ),
	red:     ( text /*: string */ ) /*: string */ => Style.parse( text, `31m` ),
	green:   ( text /*: string */ ) /*: string */ => Style.parse( text, `32m` ),
	yellow:  ( text /*: string */ ) /*: string */ => Style.parse( text, `33m` ),
	blue:    ( text /*: string */ ) /*: string */ => Style.parse( text, `34m` ),
	magenta: ( text /*: string */ ) /*: string */ => Style.parse( text, `35m` ),
	cyan:    ( text /*: string */ ) /*: string */ => Style.parse( text, `36m` ),
	white:   ( text /*: string */ ) /*: string */ => Style.parse( text, `37m` ),
	gray:    ( text /*: string */ ) /*: string */ => Style.parse( text, `90m` ),
	bold:    ( text /*: string */ ) /*: string */ => Style.parse( text, `1m`, `22m` ),
};


/**
 * Insert all variables into the message with proper formatting.
 * Leave overabundance of placeholders intact and add surplus vars in the end.
 *
 * @param  {string} text - The message
 * @param  {array}  vars - All vars in an array to be insert into the message
 *
 * @return {string}      - The message with infused vars
 */
const InsertVars /*: function */ = ( text /*: string */, vars /*: array */ = [] ) /*: string */ => {
	const message /*: string */ = Style.strip( text );
	const occurences /*: number */ = ( message.match(/#/g) || [] ).length;

	return message
		.split('#')
		.map( ( item, i ) /*: string */ =>
			vars[ i ] !== undefined && i !== occurences
				? item + Style.yellow( JSON.stringify( vars[ i ], null, Log.pretty ? ' ' : null ) )
				: item + '#'
		)
		.join('')
		.slice( 0, -1 )
		.concat( occurences < vars.length
			? ` ${ vars.slice( occurences ).map( item /*: string */ => Style.yellow( JSON.stringify( item ) ) ) }`
			: ''
		);
};


/**
 * Render a flag by removing ansi code an replacing magic strings
 *
 * @param  {string} flag - The flag string unrendered
 *
 * @return {string}      - The flag string stripped of all ansi and replaced with magic
 */
const RenderedFlag /*: function */ = ( flag /*: string */ ) /*: string */ => flag.replace( /#timestamp#/g, new Date().toString() );


/**
 * Calculate the largest flag size
 *
 * @param  {object} flags - An object of all flag messages
 *
 * @return {integer}      - The size of the largest flag
 */
const LargestFlag /*: function */ = ( flags /*: object */ = Log.flags ) /*: integer */ => Object.keys( flags )
	.filter( item /*: boolean */ => !Log.disableIndent.includes( item ) )
	.map( item /*: string */ => Style.strip( RenderedFlag( flags[ item ] ) ) )
	.reduce( ( a, b ) /*: string */ => a.length > b.length ? a : b )
	.length;


/**
 * Find new lines and add shoulders to them each
 *
 * @param  {string}  text     - The text to be indented
 * @param  {string}  type     - The type of message
 * @param  {integer} maxWidth - The width of the terminal window, default: Size().width
 *
 * @return {string}           - The message nicely indented
 */
const IndentNewLines /*: function */ = ( text /*: string */, type /*: string */, maxWidth /*: integer */ = Size().width ) /*: string */ => {
	if( Log.disableIndent.includes( type ) || typeof text !== 'string' ) {
		return text;
	}
	else {
		const largestFlag /*: number */ = LargestFlag();
		const shoulder /*: string */ = ' '.repeat( largestFlag - 1 );

		return text
			.replace( /\r?\n|\r/g, '\n' )  // first we clean messy line breaks
			.split('\n')                   // then we take each line
			.map( line /*: string */ => {
				let width /*: number */ = largestFlag;     // and start with the default shoulder

				return line
					.split(' ')                // now we look at each word
					.map( word /*: string */ => {            // and see what length it is minus ansi codes
						width += Style.strip( RenderedFlag( word ) ).length + 1;

						if( width > maxWidth ) { // if we find a word will not fit
							width = largestFlag + Style.strip( RenderedFlag( word ) ).length + 1;
							                       // we add a new line and push the word onto that next line
							return `\n${ shoulder }${ word }`;
						}
						else {
							return word;
						}
					})
					.join(' ');
			})
			.join(`\n${ shoulder }`);      // and each new line already in the message gets a shoulder
	}
};


/**
 * Get shoulder message with flag and spacing
 *
 * @param  {string}  type  - The type of message
 * @param  {object}  flags - All flags in a neat object
 *
 * @return {string}        - The shoulder message
 */
const Shoulder /*: function */ = ( type /*: string */, flags /*: object */ = Log.flags ) /*: string */ => `${ RenderedFlag( flags[ type ] ) }${ ' '.repeat(
		LargestFlag( flags ) - Style.strip( RenderedFlag( flags[ type ] ) ).length > 0
			? LargestFlag( flags ) - Style.strip( RenderedFlag( flags[ type ] ) ).length
			: 0
	) }`;


/**
 * Filter verbose text by a regex match
 *
 * @param  {string} text   - The message that is about to be send to stdout
 * @param  {string} filter - The string we filter our message by, default: Log.verboseFilter
 *
 * @return {boolean}       - Whether or not to show this message depending on the filter
 */
const Filter /*: function */ = ( text /*: string */, filter /*: string */ = Log.verboseFilter ) /*: boolean */ => {
	const re /*: object */ = new RegExp( filter, 'g' );

	return text.match( re );
};


/**
 * Format a message by type
 *
 * @param  {string}  type     - The type of message
 * @param  {string}  text     - The message
 * @param  {array}   vars     - All variables to be placed into the message
 * @param  {integer} maxWidth - The width of the terminal window, default: Size().width
 *
 * @return {string}           - The formated message with vars and indentation
 */
const Output /*: function */ = ( type /*: string */, text /*: string */, vars /*: array */, maxWidth /*: integer */ = Size().width ) /*: string */ => {
	if( typeof Log.flags[ type ] === 'undefined' ) {
		console.error(
			Style.red(`Error: Type ${ Style.yellow( type ) } was not recognized. Can only be one of:\n${ Style.yellow( [ 'hr', ...Object.keys( Log.flags ) ] ) }`)
		);
		return void( 0 );
	}
	else {
		const shoulder /*: string */ = Shoulder( type );
		const linebreak /*: string */ = Log.disableIndent.includes( type ) ? '\n' : '';
		const message /*: string */ = IndentNewLines( InsertVars( text, vars ), type, maxWidth );

		return `${ shoulder }${ linebreak }${ message }`;
	}
};


/**
 * A logging object
 *
 * @type {Object}
 */
const Log /*: object */ = {
	/**
	 * Settings
	 */
	verboseMode /*: boolean */: false,      // verbose flag
	verboseFilter /*: string */: '',        // verbose filter
	disableIndent /*: array */: [ 'time' ], // disable indentation for new lines
	pretty /*: boolean */: false,           // enable pretty printing variables
	flags /*: object */: {                  // all flag messages
		banner /*: string */: ` 📣  `,
		error /*: string */: ` 🔥  ERROR: `,
		info /*: string */: ` 🔔  INFO: `,
		ok /*: string */: ` 👍  `,
		done /*: string */: ` 🚀  DONE: `,
		time /*: string */: ` 🕐  [${ Style.bold('#timestamp#') }] `,
		verbose /*: string */: ` 😬  VERBOSE: `,
	},

	/**
	 * Log calls
	 *
	 * @param  {string} text - The message you want to log
	 */
	banner:  ( text /*: string */, ...vars ) /*: void */ => console.log( Output( 'banner', text, vars ) ),
	error:   ( text /*: string */, ...vars ) /*: void */ => console.error( Style.red( Output( 'error', text, vars ) ) ),
	info:    ( text /*: string */, ...vars ) /*: void */ => console.info( Output( 'info', text, vars ) ),
	ok:      ( text /*: string */, ...vars ) /*: void */ => console.log( Style.green( Output( 'ok', text, vars ) ) ),
	done:    ( text /*: string */, ...vars ) /*: void */ => console.log( Style.green( Output( 'done', text, vars ) ) ),
	time:    ( text /*: string */, ...vars ) /*: void */ => console.log( Output( 'time', text, vars ) ),
	hr:      ( maxWidth /*: integer */ = Size().width ) /*: void */ => console.log(`\n ${ Style.gray( '═'.repeat( maxWidth > 1 ? maxWidth - 2 : 0 ) ) } \n`),
	verbose: ( text /*: string */, ...vars ) /*: void */ => {
		const output /*: string */ = Output( 'verbose', text, vars );

		if( Filter( output ) && Log.verboseMode ) {
			console.log( output );
		}
	},

	Style,
	Output,

	__test__: {
		Size,
		InsertVars,
		RenderedFlag,
		LargestFlag,
		IndentNewLines,
		Shoulder,
		Filter,
	}
};


/**
 * EXPORT
 */
module.exports = exports = Log;
