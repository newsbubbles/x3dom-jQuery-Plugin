/********* jqX3D:  jQuery x3dom plugin

Original author: Nathaniel D. Gibson
version: 0.1 Alpha
guide: (none yet)
license: BSD (license link)
website: http://x3domjquery.com
contact: nathaniel.gibson on Skype

description: 
	
	This is a plugin for jQuery which makes it easier to create and
	load objects into the x3dom scene.  It also includes functions for
	creating and routing position/orientation/scale and other important tools
	full description of methods and properties of the x3d jQuery plugin at
	x3d.
	
DISCLAIMER: Nathaniel D. Gibson is not a member of x3dom nor is associated
	with the x3dom project.  This code is offered AS IS and comes with no
	guarantee of function.
	
******** do not remove the above information ********

Usage Examples:

$('scene').x3d('cube','mycube');

//jump (teleport) my object directly to a position
$('#mycube').x3d('jump',[1, 1, 1]);

//change the material we're working with

//Set the object's child creation 3d cursor to a relative position
$('scene').x3d('setcursor',[-1,0,1]);

//Add some 2D text in 3D
$('scene').x3d('text','hello','Hello world');

# move mycube (using x3dom animation) - linear type movement is default
# smooth animation tries to create positionIndexes that are curved
# full control type animation can be used if an object is passed like:
# 	{ key : "0 0.5 1", keyValue : "0 0 0 1 1 1 3 2 -1" }
# creates elements for positionInterpolator, timer and Routes
$('#mycube').x3d('move',[1,1,1],'linear');
$('#mycube').x3d('move',[[0,0,0],[1,1,1],[3,2,-1]],'smooth');
$('#mycube').x3d('move',{ key : "0 0.5 1", keyValue : "0 0 0 1 1 1 3 2 -1" });

Needs:

security of function context.  For instance, it should not be possible
	to set the material of a material object, or if the user does
	try that, it should be a feature which changes the "USE" of the
	material which is $(this)...  see the makescene method for example
	
balance of DEF & USE.  The system needs to only create the xhtml for new
	transforms, materials, shapes, and coordinateIndexes and give them properly
	identified unique DEF tags.  
	
make ability to change cursorPos based off of double click of mouse in x3d canvas
	either that or also use e.hitPnt method that p3d.js uses

to run using a JSON array of x3d commands/arguments, perhaps received from the server
	[ ['scene',['sphere','mysphere']], [['container','mygroup']], ... ['mygroup',['load','x3d\gear.x3dom']], ...]
	one function called "quick" for example could take this array, and then walk it, running all methods given
	another function could be set up.. "load" to load a JSON array from a specific URL
*/

x3dAnims = [];

(function( $ ) {
	var angle3d = {
		
	}

	/* private functions */
	var private = {
	
	}

	var methods = {
		numscenes : 0,
		cursorPos : [0, 0, 0],
		cursorRot : [0, 0, 1, 0],
		coords : [0, 0, 0],
		parentOffset : function() { return $(this).parent().attr("translation"); },
		timer : "maintimer",
		numLines : 0,
		tempScale : "1 1 1",
		numPos : 0,
		
		material : {
			name : "material01",
			ambientIntensity : "0.0933",
			diffuseColor : ".5 .5 .8",
			shininess : "0.31",
			specularColor : "1 1 1",
			transparency : "0.0",
			emissiveColor : "0 0 0",
			texture : "",
		},
		
		animation : {
			name : "anim",
			keyIndex : {},
			position : {},
			orientation : {},
			scale : {},
			timer : ""
		},
		
		/****** X3DOM HTML block render funtions 
		 * All functions that return strings of html objects which represent jqX3D 
		 */
		
		/* Renders an appearance block defined by def (or it's use equivalent) and returns it in x3dom html */
		appearance : function( def ){
			if (!DEFExists(def)){
				deft = 'DEF="' + def + '" ';
				if (methods.material.texture.length){ tex = '<ImageTexture url="' + methods.material.texture + '" />';} else {tex = '';}
				return '<Appearance id="app_' + def + '"><Material id="' + def + '" ' + deft + 'diffuseColor="' + methods.material.diffuseColor + '" specularColor="' + methods.material.specularColor +'" emissiveColor="' + methods.material.emissiveColor + '" ambientIntensity="' + methods.material.ambientIntensity + '" shininess="' + methods.material.shininess + '" transparency="' + methods.material.transparency + '"/>' + tex + '</Appearance>';
			}else{
				return '<Appearance><Material USE=" + def + "/></Appearance>';
			}
		},
		
		opentransform : function( tid ){
			if (arguments[1]){
				a = arguments[1];
				return '<transform id="' + tid + '" def="' + tid + '_DEF" translation="' + a.translation + '" rotation="' + a.rotation + '" size="1 1 1">';
			}else{
				return '<transform id="' + tid + '" def="' + tid + '_DEF" translation="' + methods.cursorPos[0] + ' ' + methods.cursorPos[1] + ' ' + methods.cursorPos[2] + '" rotation="' + methods.cursorRot[0] + ' ' + methods.cursorRot[1] + ' ' + methods.cursorRot[2] + ' ' + methods.cursorRot[3] + '" size="1 1 1">';
			}
		},

		/****** Creation METHODS */
		
		/* the cursor is my addition to the existing x3d DOM objects
		 * it acts as the position of the 3d "brush" for placing objects
		 * within $(this). each object has it's own cursor at [0,0,0] default
		 * normally used with scene tag since scene's [0,0,0] is the real center.
		 */
		setcursor : function( location ){
			if (arguments[1]){
				methods.cursorRot = arguments[1];
			}
			methods.cursorPos = location;	
		},
		
		/* cursororbit 
		 * 	makes the cursor auto-place the cursor in a random orbit of the object
		 *	range changes the possible range of orbit radius in units
		 *	example1: $('scene').x3d('cursororbit','#thesun',[2,5]);
		 *    constraints are optional and follow this syntax as alternate range arg: 
		 *		[[radius-low, radius-hi],[lat-low, lat-hi],[long-low, long-hi]]
		 *		radius is in units, lat and log are in degrees or radians
		 *	example2: $('scene').x3d('cursororbit','#thesun',[[20],[20,30]
		 *		    $('scene').x3d('sphere','earth');
		 *		    $('#earth').x3d('size',{ context: '#thesun', ratio: 0.009165903 });
		 */
		cursororbit : function( obj, range){
		
		},
		
		makeworld : function(worldID, width, height){
			$this.append('<x3d id="' + worldID + '" height="' + height + '" width="' + width + '">');
		},
		
		makescene : function(sceneId){
			if ($(this).is("x3d")){
				++numscenes;
				$(this).append('<scene id="sc' + numscenes + '"></scene>');
			}
		},
		
		/* CREATION scope: scene or transform container */
		
		load : function ( objURL ){
			$.ajax({
				url: objURL,
				success: function( data ) {
					$(this).append(data);
				}
			});
		},
		
		inline : function( url ){

		},
		
		cube : function( tid ){
			def = name + '_DEF';
			(!DEFExists(def)) ? deft = 'DEF="' + def + '" ' : deft = '';
			defaults = { size : [2, 2, 2], solid : true };
			if (arguments[1]) $.extend(defaults, arguments[1]);
			$(this).append(methods.opentransform(tid) + '<shape DEF="' + tid + '_shape">' + methods.appearance(tid + '_material') +'<box DEF="' + tid + '_box" size="' + defaults.size[0] + ' ' + defaults.size[1] + ' ' + defaults.size[2] + '" solid="' + defaults.solid + '"></box></shape></transform>');
		},
		
		sphere : function( tid ){
			//alert(arguments[0]);
			def = tid + '_DEF';
			(!DEFExists(def)) ? deft = 'DEF="' + def + '" ' : deft = '';
			defaults = { radius : 1, solid : true };
			if (arguments[1]) $.extend(defaults, arguments[1]);
			$(this).append(methods.opentransform(tid) + '<shape DEF="' + tid + '_shape">' + methods.appearance(tid + '_material') +'<sphere id="' + tid + '_sphere" DEF="' + tid + '_sphere" radius="' + defaults.radius + '" solid="' + defaults.solid + '"></sphere></shape></transform>');				
		},
		
		cone : function( tid ){
			var def = tid + '_DEF';
			(!DEFExists(def)) ? deft = 'DEF="' + def + '" ' : deft = '';
			defaults = { base : 1, bottom : true, height : 2, solid : true };
			if (arguments[1]) $.extend(defaults, arguments[1]);
			$(this).append(methods.opentransform(tid) + '<shape DEF="' + tid + '_shape">' + methods.appearance(tid + '_material') +'<cone DEF="' + tid + '_cone" bottomRadius="' + defaults.base + '" bottom="' + defaults.bottom + '" height="' + defaults.height + '" solid="' + defaults.solid + '"></cone></shape></transform>');
		},
		
		cylinder : function( tid ){
			def = tid + '_DEF';
			(!DEFExists(def)) ? deft = 'DEF="' + def + '" ' : deft = '';
			defaults = { radius : 1, height: 2, bottom : true, top : true,  solid : true };
			if (arguments[1]) $.extend(defaults, arguments[1]);
			$(this).append(methods.opentransform(tid) + '<shape DEF="' + tid + '_shape">' + methods.appearance(tid + '_material') +'<cylinder DEF="' + tid + '_cylinder" height="' + defaults.height + '" radius="' + defaults.radius + '" bottom="' + defaults.bottom + '" top="' + defaults.top + '" solid="' + defaults.solid + '"></cylinder></shape></transform>');
		},
		
		text : function (tid, thetext ){
			def = tid + '_DEF';
			(!DEFExists(def)) ? deft = 'DEF="' + def + '" ' : deft = '';
			fontstyle = { font : "'Verdana' 'Orbitron'", style : "BOLDITALIC", justify : "Middle", size : 35, leftToRight : "True" };
			if (arguments.length = 3) $.extend(fontstyle, arguments[2]);
			$(this).append(methods.opentransform(tid) + '<shape DEF="' + tid + '_shape">' + methods.appearance(tid + '_material') + '<text id="' + tid + '_text" string="' + thetext + '" solid="false"><fontstyle family="' + fontstyle.font + '" style="' + fontstyle.style + '" justify="' + fontstyle.justify + '" size="' + fontstyle.size + '" leftToRight="' + fontstyle.leftToRight + '"></fontstyle></text></shape></transform>');
		},
		
		plane : function( tid ){
			def = tid + '_DEF';
			(!DEFExists(def)) ? deft = 'DEF="' + def + '" ' : deft = '';
		
		},
		
		light : function( tid ){
		
		},
		
		sky : function( skyinfo ){
		
		},
		
		container : function( tid ){
			//creates an empty transform object that can have other transforms loaded into it.
			//This is great for having items load in specific pre-set places and relative to other
			//items in that container group
			//container's cursorPos is [0,0,0] and not same as scene's cursorPos so it's children will use that point as a reference
			//also, when container is moved, all other objects should move with it.
			if (arguments[1]){
				a = arguments[1];
				$(this).append('<transform id="' + tid + '" def="' + tid + '_DEF" translation="' + a.translation + '" rotation="' + a.rotation + '" size="1 1 1"></transform>');
			}else{
				$(this).append('<transform id="' + tid + '" def="' + tid + '_DEF" translation="' + methods.cursorPos[0] + ' ' + methods.cursorPos[1] + ' ' + methods.cursorPos[2] + '" rotation="' + methods.cursorRot[0] + ' ' + methods.cursorRot[1] + ' ' + methods.cursorRot[2] + ' ' + methods.cursorRot[3] + '" size="1 1 1"></transform>');
			}
		},
		
		/**** Textures the object with 
		 *
		 */
		texture : function( url ){
			methods.material.texture = url;
			oid = $(this).attr('id');
			texid = oid + '_texture';
			if (!$('#' + texid).length){
				aid = 'app_' + oid + '_material';
				$('#' + aid).append('<ImageTexture id="' + texid + '" url="' + url + '" />');
			}else{
				$('#' + texid).attr('url', url);
			}
		},
		
		/** Viewpoint Management for use with Scene
		 * view function creates a viewpoint if not created
		 * then it binds the camera to the viewpoint, performing
		 * the nice smooth x3d camera animation
		 * transforms the lookingAt coordinates into 4 point orientation
		 */
		view : function( viewid, location, rotation){
			/* change orientation to lookingAt (calculate quaternion [w,x,y,z] angle to lookingAt object
			 * http://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation - http://www.flipcode.com/documents/matrfaq.html
			 * solving euclidean triangles - http://www.mathsisfun.com/algebra/trig-solving-ssa-triangles.html
			 */
			zoom = .5
			if (arguments[3].length) zoom = arguments[3];
			orientation = (rotation.length == 3) ? euclid2RAA(rotation) : rotation;
			if (!$('#' + viewid).length){
				$(this).append('<viewpoint id="' + viewid + '" description="' + viewid + '" orientation="' + orientation[0] + ' ' + orientation[1] + ' ' + orientation[2] + ' ' + orientation[3] + '" position="' + location[0] + ' ' + location[1] + ' ' + location[2] + '" fieldOfView="' + zoom + '"></viewpoint>');
			}
			//if looking at is a string, find target object's location
			//	use euclidean triangle solving to get angles x,y,z
			methods.changeview(viewid);
		},
		
		/* simple function to bind camera to an existing viewid */
		changeview : function( viewid ){
     	            $('#' + viewid).attr('set_bind','true');		
		},
		
		/* copies the current user view to a viewpoint */
		copyview : function( viewid ){
			
		},
		
		/** Draws a 3D line
		 *	coords example: [[x1,y1,z1],[x2,y2,z2],[x3,y3,z3]]
		 *
		 */
		line : function( tid, coords ){
			def = tid + '_DEF';
			(!DEFExists(def)) ? deft = 'DEF="' + def + '" ' : deft = '';
			var vcount = coords.length;
			var cout = "";
			for (i = 0; i < vcount; i++){
				if (i > 0){ spc = " ";} else { spc = "";}
				cout = cout + spc + coords[i].join(' ');
			}
			methods.numLines++;
			$(this).append(methods.opentransform(tid) + '<shape DEF="' + tid + '_shape"><lineset vertexCount="' + vcount + '"><coordinate point="' + cout + '"/></lineset></shape></transform>');
		},
		
		connect : function( ){
			//alert(arguments[0]);
			var coords = [];
			for (i=0; i<arguments.length; i++) {
				coords[i] = $('#' + arguments[i]).attr('translation');
			}
			methods.line('line' + methods.numLines, coords);
		},
		
		/********** Setting Properties of x3dom elements */
		
		/*Shorthand way to set simply a color (diffuseColor attribute of a material)
			takes: Hex, RGB array (max intensity 1, min 0)
			example: $('#materialID').x3d('setcolor','#AC10F9');
				is the same as...
				   $('#materialID').x3d('setcolor',[0.413, 0.005182, 0.947]);
		*/
		color : function( color ){
			//if done on scene context, change methods.material for creation
			//	if not, you need to use this only with a material id 
			// determine color
			if (!$.isArray(color)){
				mycolor = hex2rgb(color);
			}else{
				mycolor = color;
			}
			//if ($(this).is('material')){ 
				$(this).attr('diffuseColor',mycolor[0] + ' ' + mycolor[1] + ' ' + mycolor[2]);
			//}
			methods.material.diffuseColor = mycolor;
		},
		
		setmaterial : function( mat ){
			if (mat.length) $.extend(methods.material, mat);
		},
		
		link : function( url ){
			//wraps object in an "Anchor tab".  If url begins in #
			//	then make go to viewpoint if necessary
		},
		
		/********** basic Animation METHODS */
		
		/* outputs a unique TimeSensor element */
		timer : function( tid, ci, loop ){
			//output a timeSensor
			t = $('#' + tid);
			if (!t.length){
			} else {
				//if (loop == true){ dolp = true; } else { dolp = false; }
				//t.attr('cycleInterval',ci).attr('loop',dolp);
				$('#' + tid).remove();
			}
				if (loop == true){ looptxt = ' loop="true"'; }else{ looptxt = '';}
				$('scene').append('<TimeSensor id="' + tid + '" cycleInterval="' + ci + '"' + looptxt + ' startTime=""/>');
		},
		
		/* makes a route, only use when $(this) is 'scene' or a scene DOM element */
		route : function( fromNode, fromField, toNode, toField ){
			theselector = $('route[fromnode="' + fromNode + '"][tonode="' + toNode + '"]');
			//alert(theselector);
			if (theselector.length) theselector.remove();
			$('scene').append('<route id="' + fromNode + '_route" fromNode="' + fromNode + '" fromField="' + fromField + '" toNode="' + toNode + '" toField="' + toField + '"/>');
		},

		/* set up a sensor for this object
		 *
		 */
		sensor : function( tid, type){
		
		},
		
		unroute : function( fromNode, toNode ){
			$('route[fromnode="' + fromNode + '"][tonode="' + toNode + '"]').remove();
		},
		
		/* set up a proximity sensor with routes and everything */
		proximity : function( ){
			//set up proximity sensor for $(this) gets prepended to element
			//set up a timesensor
			//route it to $(this).attr('def')
			/**** code in x3dom to make a sensor  for proximity (needs to be routed to something later)
	          <ProximitySensor DEF='SENSOR' size='8 8 8'/> 
		    <ROUTE fromNode='SENSOR' fromField='enterTime' toNode='ClockNumber1' toField='startTime'/>
		    <ROUTE fromNode='SENSOR' fromField='exitTime' toNode='ClockNumber1' toField='stopTime'/>
		    <ROUTE fromNode='ClockNumber1' fromField='fraction_changed' toNode='ORIINT' toField='set_fraction'/>
		    <ROUTE fromNode='ORIINT' fromField='value_changed' toNode='TRANS1' toField='set_rotation'/>
			*/
		},
		
		/* jump and size work as direct manipulation of objects,
		 *	their x3dom animation counterparts are move and scale respectively.
		 */
		jump : function( location ){
			if (arguments[1]){
				$(arguments[1]).attr('translation',location.join(' '));
			}else{
				$(this).attr('translation',location.join(' '));
			}
		},
		
		/* Resets object's rotation to original world alignment */
		realign : function( ){
			$(this).attr('rotation','0 0 1 0');
		},
		
		size : function( sizeArr ){
			$(this).attr('scale',sizeArr[0] + ' ' + sizeArr[1]+ ' ' + sizeArr[2]);
		},
		
		point : function( rotArr ){
			rot = (rotArr.length == 3)? euclid2RAA(rotArr) : rotArr;
			$(this).attr('rotation',rot[0] + ' ' + rot[1] + ' ' + rot[2] + ' ' + rot[3]); 
		},

		/* moves an object using x3dom's timeSensor, positionInterpolator, and a Route
		 * 	time is in seconds and represents time for completion of all keyframes
		 */
		move : function( location, time, loop ){
			if (arguments[2]){ loop = arguments[2];} else{ loop = false;}
			oid = $(this).attr('id');
			if (!time) time = 5;
			methods.timer(oid + '_timer_move',time,loop);
			if (arguments[3]) {tid = arguments[3];} else {tid = oid + '_pos';}
			el = $('#' + tid);
			if (el.length) el.remove();
			curPos = $(this).attr('translation');
			if ($.isArray(location[0])){
				numkeys = location.length;
				keyVals = curPos; keys = '0';
				i = 0;
				for (i = 1; i <= numkeys; i++){
					fraction = i / numkeys;
					keys = keys + ' ' + fraction.toFixed(5);
					keyVals = keyVals + ' ' + location[i - 1].join(' ');
				}
				finalKeyVal = location[numkeys - 1].join(' ');
			}else{
				keys = '0 1';
				keyVals = curPos + ' ' + location.join(' ');
				finalKeyVal = location.join(' ');
			}
			$('scene').append('<PositionInterpolator id="' + tid + '" DEF="' + tid + '" key="' + keys + '" keyValue="' + keyVals + '"/>');
			methods.route(tid, 'value_changed', $(this).attr('def'), 'translation');
			methods.route(oid + '_timer_move', 'fraction_changed', tid, 'set_fraction');
			$(this).attr('translation',finalKeyVal);
		},
		
		moveTo : function(targetObject, offset){
			$(this).move(offset3D($(targetObject).attr('translation'), offset));
		},
		
		/* Rotate object by the given rotation
		 * 	rotation can be given in Euclidean [x, y, z] or x3d spec RAA (rotation axis & angle) [x, y, z, a]
		 *		if euclidean rotation, it will all be translated to quaternion
		 *		x, y, z are normalized 0 to 1 (1 being largest rotation) (negative numbers are to the left of 0, postive numbers are to the right)
		 *		a is the number of radians to actually rotate on each axis
		 *		quaternion point 0 is on euclidean point 180 degrees
		 *		360 degrees = 6.28318531 radians, 1 degree = 0.0174532925 radians
		 *		R = 0.0174532925
		 *		euclidean: [120, 40, 280] - 180 = [-60, -140, 100] (use absolute vals for normalization calculation of max rotation)
		 *			normal = abs(degrees) / abs(max degrees) * polarity
		 *			normalized: [ -0.42857, -1, 0.714, (140 * R) = 2.44346095]
		 *	if relative is true, the rotation is added to current rotation
		 */
		rotate : function( rotation, time, loop ){
			if (arguments[2]){ loop = arguments[2];} else{ loop = false;}
			oid = $(this).attr('id');
			if (!time) time = 5;
			methods.timer(oid + '_timer_rotate',time,loop);
			if (arguments[3]) {tid = arguments[3];} else {tid = oid + '_rot';}
			el = $('#' + tid);
			if (el.length) el.remove();
			curRot = $(this).attr('rotation');
			if ($.isArray(rotation[0])){
				numkeys = rotation.length;
				keyVals = curRot; keys = '0';
				for (i = 1; i <= numkeys; i++){
					fraction = i / numkeys;
					ib = i - 1;
					if (rotation[ib].length == 3){ rot = euclid2RAA(rotation[ib]);} else { rot = rotation[ib]; }
					keys = keys + ' ' + fraction.toFixed(5);
					keyVals = keyVals + ', ' + rot.join(' ');
				}
				finalKeyVal = rot.join(' ');
			}else{
				keys = '0 1';
				if (rotation.length == 3){ rot = euclid2RAA(rotation);} else { rot = rotation; }
				keyVals = curPos + ' ' + rot.join(' ');
				finalKeyVal = rot.join(' ');
			}
			$('scene').append('<OrientationInterpolator id="' + tid + '" DEF="' + tid + '" key="' + keys + '" keyValue="' + keyVals + '"/>');
			methods.route(tid, 'value_changed', $(this).attr('def'), 'rotation');
			methods.route(oid + '_timer_rotate', 'fraction_changed', tid, 'set_fraction');
			$(this).attr('rotation',finalKeyVal);		
		},
		
		/* Rotates object to the same orientation as the targetObject */
		rotateLike : function( targetObject ){
			$(this).attr('rotation',$(targetObject).attr('rotation'));
		},
		
		/* Use quaternion matrix math to make this look at a point 
		 * 	translate vector to a 
		 */
		lookAt : function( lookPoint ){
		
		},
		
		scale : function( scaling, time, loop ){
			/*if (arguments[2]){ loop = arguments[2];} else{ loop = false;}
			oid = $(this).attr('id');
			attrib = 'scale';
			tgNm = $(this).get(0).tagName;
			if (tgNm == 'box'){
				attrib = 'size';
			} else if (tgNm == 'sphere'){
				attrib = 'radius';
			}
			if (!time) time = 5;
			methods.timer(oid + '_timer_scale',time,loop);
			if (arguments[3]) {tid = arguments[3];} else {tid = oid + '_scale';}
			el = $('#' + tid);
			if (el.length) el.remove();
			curScale = $(this).attr(attrib);
			if ($.isArray(scaling[0])){
				numkeys = scaling.length;
				keyVals = curScale; keys = '0';
				for (i = 1; i <= numkeys; i++){
					fraction = i / numkeys;
					keys = keys + ' ' + fraction.toFixed(5);
					keyVals = keyVals + ', ' + scaling[i - 1].join(' ');
				}
				finalKeyVal = scaling[numkeys - 1].join(' ');
			}else{
				keys = '0 1';
				keyVals = curScale + ' ' + scaling.join(' ');
				finalKeyVal = scaling.join(' ');
			}
			$('scene').append('<ScalarInterpolator id="' + tid + '" DEF="' + tid + '" key="' + keys + '" keyValue="' + keyVals + '"/>');
			methods.route(tid, 'value_changed', $(this).attr('def'), attrib);
			methods.route(oid + '_timer_scale', 'fraction_changed', tid, 'set_fraction');
			$(this).attr(atrrib,finalKeyVal);*/		
		},
		
		/****** Pre-set animation shortcuts 
		 * Uses or sets pre-defined animation sequences
		 * ideas for animations: pulse, thump, shake, explode, fallover, wave, yes, no, thike, halfsize, doublesize, triplesize
		 * 	make object extensible so that more animations can be defined in js
		 * 	animation = { name, positionKeys {key,keyValue} , orientationKeys {...}, scaleKeys {...}}
		 */		
		animate : function( anim ){
		
		},
		
		stop : function( ){
			oid = $(this).attr('id');
			$('timesensor[id~="' + oid + '_timer"]').remove();
		},
		
		/****** For advanced animation, perhaps possible to use BOIDS
		 *	could break down child transforms of a main transform as each boid
		 */
		
		/****** hahahaha, physics would be an awesome addition */
		
		/****** Other important methods */
		
		merge : function(target, newid){
			//merges two transform objects into one transform
			//with a group that contains the direct child element of both this object
		},
		
		to : function(targetObject){
			return diff3D($(this).attr('translation'), $(targetObject).attr('translation'));
		},
		
		is3D : function(){
			/* returns whether or not an element is an x3d type element */
			return /[x3d|scene|group|transform|shape|appearance|material|indexedfaceset|pointlight]/.test($this.get(0).tagName);
		},
		
		show : function( ){
			$(this).attr('scale',methods.tempScale);
		},
		
		hide : function( ){
			methods.tempScale = $(this).attr('scale');
			$(this).attr('scale','0 0 0');
		},
		
		/********** System METHODS */
		
		support : function( ){
			//check webGL support
		}
	
		/*destroy : function( ) {

			return this.each(function(){

				var $this = $(this),
				data = $this.data('X3D');

				// Namespacing FTW
				$(window).unbind('.X3D');
				data.tooltip.remove();
				$this.removeData('X3D');

			})

		}*/
	};
	
	$.fn.x3d = function( method ) {
		
	    // Method calling logic
	    if ( methods[method] ) {
	    	//alert(arguments[0] + ' ' + arguments[1]);
	      ret = methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } else if ( typeof method === 'object' || ! method ) {
		//return methods.init.apply( this, arguments );
	    } else { 
	    	$.error( 'Method ' +  method[0] + ' does not exist on jQuery.X3D' );
	    }
		    
	    return this;
			
	};
	
})( jQuery );


function offset3D(position, offset){
	var newpos = [];
	newpos[0] = position[0] + offset[0];
	newpos[1] = position[1] + offset[1];
	newpos[2] = position[2] + offset[2];
	return newpos;
}

function diff3D(position1, position2){
	var newpos = [];
	newpos[0] = position1[0] - position2[0];
	newpos[1] = position1[1] - position2[1];
	newpos[2] = position1[2] - position2[2];
	return newpos;
}

function hex2rgb(h){
	if (h.charAt(0)=="#"){ h = h.substring(1,7);}
	r = parseInt(h.substring(0,2),16) / 255;
	g = parseInt(h.substring(2,4),16) / 255;
	b = parseInt(h.substring(4,6),16) / 255;
	alert([h,r.toFixed(3),g.toFixed(3),b.toFixed(3)]);
	return [r.toFixed(3), g.toFixed(3), b.toFixed(3)];
}

function radian2degree(rad){ return rad * 57.2957795; }

function degree2radian(deg){ return deg / 57.2957795; }

function readyX3D(){return ($('x3d').length > 0) ? true : false}

function DEFExists(type,def) {return ($(type + '[DEF="' + def + '"]').length > 0) ? true : false}

function euclid2RAA( euclid ){
	rad = 0.0174532925;
	max = 0;

	d = [euclid[0], euclid[1], euclid[2]];
	
	//normalize
	for (b=0; b < 3; b++){ if (Math.abs(d[b]) > max){ max = Math.abs(d[b]);} }
	r = (max != 0) ? [d[0] / max, d[1] / max, d[2] / max] : [0, 0, 0];
	
	return [r[0].toFixed(6), r[1].toFixed(6), r[2].toFixed(6), max * rad];
}
