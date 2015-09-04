/*global angular*/
/*global $*/
'use strict';
var DEFAULT_OPT = {
    stop: false,
    count: 5,
    range: { // low interval = calm, high interval = unsettled
        x: 7,
        y: 55
    },
    duration: { // low = jitter, high = smooth
        min: 40,
        max: 50
    },
    thickness: 5,
    strokeColor: '#444',
    level: 1,
    curved: true,
    canvasWidth: 300,
    canvasHeight: 300,
    waterWidth: 300,
    waterHeight: 300,
    hasFish: true,
    imagePath: function() {
        return 'img/jug' + this.size + 'fish' + (this.hasFish ? this.qty : 0) + '.png';
    }
};

angular.module('waterline', [])
    .directive('waterline', ['$window', 'fsmService', function($window, fsmService) {
        return {
            restrict: 'AC',
            scope: true,
            link: function(scope, element, attrs) {
                // var window = $window;
                var isWater = attrs.water ? true : false;
                var c;
                var ctx;
                var cw;
                var ch;
                var ww;
                var wh;
                var points;
                var tick;
                var config = null;
                var opt = angular.copy(DEFAULT_OPT);

                var rand = function(min, max) {
                    return Math.floor((Math.random() * (max - min + 1)) + min);
                };

                var ease = function(t, b, c, d) {
                    if ((t /= d / 2) < 1)
                        return c / 2 * t * t + b;
                    return -c / 2 * ((--t) * (t - 2) - 1) + b;
                };

                var Point = function(config) {
                    this.anchorX = config.x;
                    this.anchorY = config.y;
                    this.x = config.x;
                    this.y = config.y;
                    this.setTarget();
                };

                Point.prototype.setTarget = function() {
                    this.initialX = this.x;
                    this.initialY = this.y;
                    this.targetX = this.anchorX + rand(0, opt.range.x * 2) - opt.range.x;
                    this.targetY = this.anchorY + rand(0, opt.range.y * 2) - opt.range.y;
                    this.tick = 0;
                    this.duration = rand(opt.duration.min, opt.duration.max);
                };

                Point.prototype.update = function() {

                    var dx = this.targetX - this.x;
                    var dy = this.targetY - this.y;
                    var dist = Math.sqrt(dx * dx + dy * dy);

                    if (Math.abs(dist) <= 0) {
                        this.setTarget();
                    } else {
                        var t = this.tick;
                        var b = this.initialY;
                        var c = this.targetY - this.initialY;
                        var d = this.duration;
                        this.y = ease(t, b, c, d);

                        b = this.initialX;
                        c = this.targetX - this.initialX;
                        d = this.duration;
                        this.x = ease(t, b, c, d);

                        this.tick++;
                    }
                };

                Point.prototype.render = function() {
                    this.x = config.x;
                    this.y = config.y;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2, false);
                    ctx.fillStyle = '#000';
                    ctx.fill();
                };

                var updatePoints = function() {
                    var i = points.length;
                    while (i--) {
                        points[i].update();
                    }
                };

                // var renderPoints = function() {
                //     var i = points.length;
                //     while (i--) {
                //         points[i].render();
                //     }
                // };

                var renderShape = function() {
                    ctx.beginPath();

                    var pointCount = points.length;
                    ctx.moveTo(points[0].x, points[0].y);
                    var i;
                    for (i = 0; i < pointCount - 1; i++) {
                        var c = (points[i].x + points[i + 1].x) / 2;
                        var d = (points[i].y + points[i + 1].y) / 2;
                        ctx.quadraticCurveTo(points[i].x, points[i].y, c, d);
                    }

                    ctx.lineWidth = opt.thickness;
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = opt.strokeColor;

                    ctx.lineTo(-opt.range.x - opt.thickness, wh + opt.thickness);
                    ctx.lineTo(wh + opt.range.x + opt.thickness, wh + opt.thickness);
                    ctx.closePath();
                    ctx.fillStyle = 'hsl(' + (tick / 2) + ', 80%, 60%)';
                    ctx.fill();
                    ctx.stroke();
                };

                var clear = function () {
                    ctx.clearRect(0, 0, cw, ch);
                    c.width = c.width;
                }

                function createPoints() {
                    points = [];
                    var i = opt.count + 2;
                    var spacing = (ww + (opt.range.x * 2)) / (opt.count - 1);
                    while (i--) {
                        points.push(new Point({
                            x: (spacing * (i - 1)) - opt.range.x,
                            y: wh - (wh * opt.level)
                        }));
                    }
                }

                var requestId = 0;
                var animationStartTime = 0;

                function animate() {
                    if (isWater) {
                        requestId = requestAnimationFrame(animate);
                        clear();
                        if (opt.isGoal === false) {
                            tick++;
                            updatePoints();
                        }
                        renderShape();
                        drawBowlAndFish(opt);
                    }
                }

                function start() {
                    createPoints();
                    animationStartTime = window.performance.now();
                    requestId = window.requestAnimationFrame(animate);
                }

                function stop() {
                    if (requestId) {
                        window.cancelAnimationFrame(requestId);
                        clear();
                    }
                    requestId = 0;
                }

                var initialize = function(element, xopt) {
                    opt = angular.extend(opt, xopt || {});
                    opt.level = (opt.qty || 0) * (opt.factor || 0.5);
                    c = element;
                    ctx = c.getContext('2d');

                    cw = c.width = opt.canvasWidth || c.width;
                    ch = c.height = opt.canvasHeight || c.height;
                    ww = opt.waterWidth || cw;
                    wh = opt.waterHeight || ch;
                    points = [];
                    tick = 0;

                    opt.fish = new Image()
                    opt.fish.src = opt.imagePath();

                    opt.isGoal = opt.qty === 4;
                };

                //==== BOWLS AND FISH
                //

                opt.fish = null;
                var oldQty = null;
                var drawBowlAndFish = function(options) {
                    ctx.beginPath();
                    try {
                        ctx.drawImage(options.fish, 0, 0, 300, 300);
                    } catch (e) {
                    }
                    ctx.font = '32px Arial';
                    ctx.fillStyle = 'red';
                    ctx.fillText((options.isGoal ? 'GOAL! ' : ' ') + options.qty + ' OF ' + options.size + ' GALLONS.', 4, 300);
                };

                //==== NEW OPTS FROM DIRECTIVE PARAMETERS
                //
                var newOpts = {
                    factor: attrs.factor,
                    qty: attrs.qty,
                    size: attrs.size,
                    id: attrs.id
                };

                //== DIALOG INVOKED METHODS
                //
                function setQty(qty) {
                    stop();
                    opt.qty = qty;
                    opt.level = qty * opt.factor;
                    initialize(c, opt);
                    start();
                }


                function setOpt(key, value) {
                    opt[key] = value;
                }

                var fsm = fsmService[attrs.id];
                fsm.ws = {
                    setQty: setQty,
                    setOpt: setOpt
                };

                //== WINDOW RESIZE HANDLING
                //
                var container = $(c).parent();

                //Run function when browser resizes
                $(window).resize(respondCanvas);

                function respondCanvas() {
                    $(c).attr('width', $(container).width()); //max width
                    $(c).attr('height', $(container).height()); //max height 

                    stop();
                    initialize(c);
                    start();
                }

                //== START HERE
                initialize(element[0], newOpts);
                start();

            }
        };
    }]);

