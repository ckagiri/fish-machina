/*global angular*/
'use strict';
var waterlineApp = angular.module('waterline', []);

waterlineApp.factory ('waterlineServiceProvider', function() {
    var defaultOpt = {
        count: 5,
        range: {
            x: 10,
            y: 25
        },
        duration: {
            min: 20,
            max: 40
        },
        thickness: 5,
        strokeColor: '#50F',
        factor: 0.29, // qty * factor = level. level is from 0..1, where 1 is top of box.
        level: 0.9,
        size: 5,
        curved: true
    };
    var innerWidth = 400;
    var innerHeight = 600;
    var Provider = function() {
    };
    
    Provider.prototype.init = function(elem, size, qty, factor) {
        this.opt = Object.create(defaultOpt);
        this.opt.size = size;
        this.opt.qty = qty;
        this.opt.factor = factor;
        this.opt.level = factor && qty ? qty * factor : 1;
        this.elem = elem[0];
        return this;
    };

    Provider.prototype.setQty = function(value) {
        this.opt.qty = value;
        this.opt.level = value * this.opt.factor;
        this.play();
        return this;
    };

    Provider.prototype.setOpt= function(name, value) {
        this.opt[name] = value;
        this.play();
        return this;
    };

    Provider.prototype.play = function() {
        var c =this.elem; 
        var opt = this.opt;
        var ctx = c.getContext('2d'),
            cw = c.width = innerWidth,
            ch = c.height = innerHeight,
            points = [],
            tick = 0,

            rand = function(min, max) {
                return Math.floor((Math.random() * (max - min + 1)) + min);
            },
            ease = function(t, b, c, d) {
                if ((t /= d / 2) < 1) return c / 2 * t * t + b;
                return -c / 2 * ((--t) * (t - 2) - 1) + b;
            };

        ctx.lineJoin = 'round';
        ctx.lineWidth = opt.thickness;
        ctx.strokeStyle = opt.strokeColor;

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
            ctx.beginPath();
            ctx.arc(this.x, this.y, 33, 0, Math.PI * 2, false);
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
            ctx.lineTo(-opt.range.x - opt.thickness, ch + opt.thickness);
            ctx.lineTo(cw + opt.range.x + opt.thickness, ch + opt.thickness);
            ctx.closePath();
            ctx.fillStyle = 'hsl(' + (tick / 2) + ', 80%, 60%)';
            ctx.fill();
            ctx.stroke();
        };

        var clear = function() {
            ctx.clearRect(0, 0, cw, ch);
        };

        var enabled = true;

        var loop = function() {
            if (!enabled) {
                return null;
            }
            window.requestAnimFrame(loop, c);
            tick++;
            clear();
            updatePoints();
            renderShape();
            drawFishImage(opt);
            //renderPoints();
        };

        var pushPoints = function (opt) {
            var i = opt.count + 2;
            var spacing = (cw + (opt.range.x * 2)) / (opt.count - 1);
            while (i--) {
                points.push(new Point({
                    x: (spacing * (i - 1)) - opt.range.x,
                    y: ch - (ch * opt.level)
                }));
            }
        };

        pushPoints(this.opt);

        window.requestAnimFrame = function() {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(a) {
                window.setTimeout(a, 1E3 / 60);
            };
        }();

        var fish = null;

        var drawFishImage = function(options) {
            var osize = options.size;
            ctx.font = '40px Arial';
            ctx.fillStyle = 'black'; 
            ctx.fillText(options.qty + ' GALLONS', 2, 50);
            if (options.goal === options.qty) {
                ctx.fillStyle = 'green';
                ctx.fillText('GOAL!', 250, 50);
            }
            if (!fish) {
                fish = new Image();
                fish.src = (osize === '3') ? '/js/fish/fishbowl.3.gallon.bt.png' :'/js/fish/fishbowl.5.gallon.png';
            }
            ctx.drawImage(fish, 10,90);
            ctx.fillStyle = 'white';
            ctx.fillText('HOLDS ' + osize + ' GALLONS', 2, 600);
        };

        this.stop = function() {
            enabled = false;
        };

        this.start = function() {
            enabled = true;
            loop();
        };

        this.start();
    };


    var service = {
        getInstance: function() { 
            return new Provider(); 
        },
    };

    return service;
});

waterlineApp.directive('roWaterline', ['waterlineServiceProvider', 'fsmService', function(waterlineServiceProvider, fsmService) {
    return {
        restrict: 'AC',
        scope: {
            id: '@',
            size: '@',
            qty: '@',
            factor: '@',
        },
        link: function(scope, element) {
            var ws = waterlineServiceProvider.getInstance();
            ws.init(element, scope.size, scope.qty, scope.factor);
            var fsm = fsmService[scope.id];
            fsm.ws = ws;
            ws.play();
        }
    };
}]);


// var flexibleService = waterlineApp.directive('flexibleService', function ($injector) {
//   return {
//     restrict: 'E',
//     scope: {
//       targetService: '@',
//       targetMethod: '@',
//       displayProperty: '@'
//     },
//     template: '<div>{{item[displayProperty]}}</div>',
//     link: function (scope) {
//       var service = $injector.get(scope.targetService);
//       scope.item = service[scope.targetMethod]();
//     }
//   }
// });

// flexibleService.$inject($injector);
