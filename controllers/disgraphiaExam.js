const fs = require("fs");
const data = require("../data.json");

exports.disgraphia = function (req, res) {
  const colorBackground = "rgba(255, 250, 250, 1.0)";
  const selectedColor = "lightgreen";

  var myCanvas = document.getElementById("myCanvas");
  var reportElem = document.getElementById("reportElement");
  var context = myCanvas.getContext("2d");
  var supportsPointerEvents = window.PointerEvent;
  var inStroke = false;
  var posLast = { x: 0, y: 0 };
  var isDrawing = false;
  var reportData = false;
  var useTilt = false;

  let timestamp;
  const examData = [];
  let velocityData = [];

  var primaryColorButton = document.getElementById("colorButton31");
  var secondaryColorButton = document.getElementById("colorButton52");

  var buttonProps = new Map();

  var EPenButton = {
    tip: 0x1, // left mouse, touch contact, pen contact
    barrel: 0x2, // right mouse, pen barrel button
    middle: 0x4, // middle mouse
    eraser: 0x20, // pen eraser button
  };

  /////////////////////////////////////////////////////////////////////////

  var scribblePrompt = document.getElementById("scribblePrompt");
  scribblePrompt.textContent += supportsPointerEvents
    ? " [Your browser supports PointerEvents]"
    : " [Your browser does not support PointerEvents]";

  /////////////////////////////////////////////////////////////////////////
  // Initialize page elements
  //
  function initPage() {
    setCanvasProps();
    initButton("colorButton11", "red");
    initButton("colorButton12", "red");
    initButton("colorButton21", "green");
    initButton("colorButton22", "green");
    initButton("colorButton31", "blue");
    initButton("colorButton32", "blue");
    initButton("colorButton41", "white");
    initButton("colorButton42", "white");
    initButton("colorButton51", "black");
    initButton("colorButton52", "black");
    initButton("colorButton61", "gray");
    initButton("colorButton62", "gray");
  }

  /////////////////////////////////////////////////////////////////////////

  function initButton(buttonId_I, backgroundColor_I) {
    var button = document.getElementById(buttonId_I);
    button.style.backgroundColor = backgroundColor_I;
    buttonProps.set(buttonId_I, backgroundColor_I);
    if (button == primaryColorButton || button == secondaryColorButton) {
      button.style.borderColor = selectedColor;
    }
    button.onclick = function () {
      //alert(button.id + " background: " + buttonProps.get(button.id));
      switch (button.id) {
        case "colorButton11":
        case "colorButton21":
        case "colorButton31":
        case "colorButton41":
        case "colorButton51":
        case "colorButton61":
          primaryColorButton.style.borderColor = "black";
          primaryColorButton = button;
          primaryColorButton.style.borderColor = selectedColor;
          break;
        case "colorButton12":
        case "colorButton22":
        case "colorButton32":
        case "colorButton42":
        case "colorButton52":
        case "colorButton62":
          secondaryColorButton.style.borderColor = "black";
          secondaryColorButton = button;
          secondaryColorButton.style.borderColor = selectedColor;
          break;
        default:
          // no change of color
          alert(button.id + " not found!");
      }
    };
  }

  /////////////////////////////////////////////////////////////////////////
  // Init canvas properties.
  // Sets canvas width to expand to browser window.
  // Canvas cleared to restore background color.
  //
  function setCanvasProps() {
    if (myCanvas.width < window.innerWidth) {
      myCanvas.width = window.innerWidth - 20;
    }
    clearCanvas(); // ensures background saved with drawn image
  }

  /////////////////////////////////////////////////////////////////////////
  // Enable/disable showing of device data
  //
  function toggleShowData() {
    var label;
    if (reportData) {
      label = "Click to enable showing pointer data";
    } else {
      label = "Click to disable showing pointer data";
    }
    reportData = !reportData;
    document.getElementById("showData").innerHTML = label;
  }

  /////////////////////////////////////////////////////////////////////////
  // Sets a flag to enable/disable use of the pen tilt property.
  //
  function setTilt() {
    var useTiltVal = document.querySelector('input[value="useTilt"]');
    useTilt = useTiltVal.checked;
  }

  /////////////////////////////////////////////////////////////////////////
  // Clears the drawing canvas.
  //
  function clearCanvas() {
    context.fillStyle = colorBackground;
    context.fillRect(0, 0, myCanvas.width, myCanvas.height);
  }

  /////////////////////////////////////////////////////////////////////////
  // Saves the image on the drawing canvas and then downloads a png.
  //
  function saveCanvas() {
    // IE and Edge
    if (isMSBrowser()) {
      window.navigator.msSaveBlob(myCanvas.msToBlob(), "scribble.png");
    } else {
      var link = document.getElementById("link");
      link.setAttribute("download", "Scribble.png");
      link.setAttribute(
        "href",
        myCanvas
          .toDataURL("image/png")
          .replace("image/png", "image/octet-stream")
      );
      link.click();
    }
  }

  /////////////////////////////////////////////////////////////////////////
  // Returns true if running on IE or Edge
  //
  function isMSBrowser() {
    return document.documentMode || /Edge/.test(navigator.userAgent);
  }

  /////////////////////////////////////////////////////////////////////////
  // Clears the data report field.
  //
  function clearReport() {
    reportElem.innerHTML = "";
  }

  /////////////////////////////////////////////////////////////////////////
  // Upon a window load event, registers all events.
  //
  window.addEventListener(
    "load",
    function () {
      // These events are handled for browsers that do not
      // handle PointerEvent.
      var events = [
        "MSPointerDown",
        "MSPointerUp",
        "MSPointerCancel",
        "MSPointerMove",
        "MSPointerOver",
        "MSPointerOut",
        "MSPointerEnter",
        "MSPointerLeave",
        "MSGotPointerCapture",
        "MSLostPointerCapture",
        "touchstart",
        "touchmove",
        "touchend",
        "touchenter",
        "touchleave",
        "touchcancel",
        "mouseover",
        "mousemove",
        "mouseout",
        "mouseenter",
        "mouseleave",
        "mousedown",
        "mouseup",
        "focus",
        "blur",
        "click",
        "webkitmouseforcewillbegin",
        "webkitmouseforcedown",
        "webkitmouseforceup",
        "webkitmouseforcechanged",
      ];

      // These events are for browsers that handle
      // HTML5 PointerEvent events.
      var pointerEvents = [
        "pointerdown",
        "pointerup",
        "pointercancel",
        "pointermove",
        "pointerover",
        "pointerout",
        "pointerenter",
        "pointerleave",
        "gotpointercapture",
        "lostpointercapture",
      ];

      /////////////////////////////////////////////////////////////////////////
      // Handle event rendering and reporting to output
      // for traditional mouse/touch/pen handling.
      //
      eventDraw = function (evt) {
        //console.log("screenPos:XY:" +
        //	Number.parseFloat(evt.pageX) + "," +
        //	Number.parseFloat(evt.pageY) + "; client:XY:" +
        //	Number.parseFloat(evt.clientX) + "," +
        //	Number.parseFloat(evt.clientY));

        var outStr = evt.type;
        var canvasRect = myCanvas.getBoundingClientRect();
        var screenPos = {
          x: evt.clientX,
          y: evt.clientY,
        };

        var pos = {
          x: screenPos.x - canvasRect.left,
          y: screenPos.y - canvasRect.top,
        };

        console.log("screenPos XY:" + screenPos.x + "," + screenPos.y);

        if (pos.x == undefined || pos.y == undefined) {
          console.log("WARNING: undefined position");
          return;
        }

        var pressure = evt.pressure;

        if (
          typeof evt.targetTouches != "undefined" &&
          evt.targetTouches.length > 0 &&
          typeof evt.targetTouches[0].force != "undefined"
        ) {
          outStr += " - force: " + evt.targetTouches[0].force;
        } else if (typeof evt.webkitForce != "undefined") {
          outStr += " - webkitForce: " + evt.webkitForce;
        } else if (typeof pressure != "undefined") {
          outStr += " - pressure: " + pressure;
        }

        if (typeof pressure == "undefined") {
          pressure = 1.0;
        }

        switch (evt.type) {
          case "mousedown":
          case "MSPointerDown":
          case "touchStart":
            isDrawing = true;
            posLast = pos;
            break;

          case "mouseup":
          case "MSPointerUp":
          case "touchEnd":
            isDrawing = false;
            break;

          case "mousemove":
          case "MSPointerMove":
          case "touchmove":
            if (isDrawing) {
              context.lineWidth = pressure;

              context.beginPath();
              context.lineCap = "round";
              context.moveTo(posLast.x, posLast.y);

              // Draws Bezier curve from context position to midPoint.
              var midPoint = midPointBetween(posLast, pos);
              context.quadraticCurveTo(
                posLast.x,
                posLast.y,
                midPoint.x,
                midPoint.y
              );

              // This lineTo call eliminates gaps (but leaves flat lines if stroke
              // is fast enough).
              context.lineTo(pos.x, pos.y);
              context.stroke();
            }

            posLast = pos;
            break;

          default:
            break;
        }

        // Update the readout asynchronously to the event thread.
        if (reportData) {
          outStr += "<br>";
          setTimeout(function () {
            delayedInnerHTMLFunc(outStr);
          }, 100);
        }
      };

      /////////////////////////////////////////////////////////////////////////
      // Find point between two other points.
      //
      function midPointBetween(p1, p2) {
        return {
          x: p1.x + (p2.x - p1.x) / 2,
          y: p1.y + (p2.y - p1.y) / 2,
        };
      }

      /////////////////////////////////////////////////////////////////////////
      // Handle drawing for HTML5 Pointer Events.
      //
      function pointerEventDraw(evt) {
        var outStr = "";
        var canvasRect = myCanvas.getBoundingClientRect();
        var screenPos = {
          x: evt.clientX,
          y: evt.clientY,
        };

        var pos = {
          x: screenPos.x - canvasRect.left,
          y: screenPos.y - canvasRect.top,
        };

        var pressure = evt.pressure;
        var buttons = evt.buttons;
        var tilt = { x: evt.tiltX, y: evt.tiltY };
        var rotate = evt.twist;

        if (reportData) {
          outStr = evt.pointerType + " , " + evt.type + " : ";
        }

        if (evt.pointerType) {
          switch (evt.pointerType) {
            case "touch":
              // A touchscreen was used
              pressure = 1.0;
              context.strokeStyle = "red";
              context.lineWidth = pressure;
              break;
            case "pen":
              // A pen was used
              if (buttons == EPenButton.barrel) {
                context.strokeStyle = buttonProps.get(secondaryColorButton.id);
              } else {
                context.strokeStyle = buttonProps.get(primaryColorButton.id);
              }

              if (useTilt) {
                // Favor tilts in x direction.
                context.lineWidth = pressure * 3 * Math.abs(tilt.x);
                // Uncomment for a "vaseline" (smeary) effect:
                //context.shadowColor = "blue";
                //context.shadowBlur = context.lineWidth / 2;
              } else {
                context.lineWidth = pressure * 10;
              }
              break;
            case "mouse":
              // A mouse was used
              //pressure = 2;
              //context.lineWidth = pressure;
              context.strokeStyle = "black";
              if (buttons == EPenButton.barrel) {
                pressure = 0;
                context.lineWidth = 0;
              }

              context.lineWidth = pressure;
              break;
          }

          // If pen erase button is being used, then erase!
          if (buttons == EPenButton.eraser) {
            context.strokeStyle = colorBackground;
          }

          switch (evt.type) {
            case "pointerdown":
              isDrawing = true;
              posLast = pos;
              break;

            case "pointerup":
              isDrawing = false;
              break;

            case "pointermove":
              if (!isDrawing) {
                return;
              }

              // If using eraser button, then erase with background color.
              if (buttons == EPenButton.eraser) {
                var eraserSize = 10;
                context.fillStyle = colorBackground;
                context.fillRect(pos.x, pos.y, eraserSize, eraserSize);
                context.fill;
              }

              // To maintain pressure setting per data point, need to turn
              // each data point into a stroke.
              // TODO - this code "works" but draws flat lines if stroke is very fast.
              // Need a way to fill in more of a curve between each pair of points.
              // Possibly fill in the gap with interpolated points when the distance
              // between each pair of generated points is larger than some value.
              // See https://codepen.io/kangax/pen/FdlHC?editors=1010 for sample code
              // of how to determine distance between points.
              else if (pressure > 0) {
                context.beginPath();
                context.lineCap = "round";
                context.moveTo(posLast.x, posLast.y);

                // Draws Bezier curve from context position to midPoint.
                var midPoint = midPointBetween(posLast, pos);
                context.quadraticCurveTo(
                  posLast.x,
                  posLast.y,
                  midPoint.x,
                  midPoint.y
                );

                // This lineTo call eliminates gaps (but leaves flat lines if stroke
                // is fast enough).
                context.lineTo(pos.x, pos.y);
                context.stroke();
              }

              posLast = pos;
              break;

            case "pointerenter":
              document.body.style.cursor = "crosshair";
              break;

            case "pointerleave":
              document.body.style.cursor = "default";
              break;

            default:
              outStr += "WARNING: unhandled event: " + evt.type;
              console.log("WARNING: unhandled event: " + evt.type);
              break;
          }

          // Reporting data will cause drawing lag, resulting in flat lines.
          // IE11 barfs on Number.parseFloat(xxxx).toFixed(3)
          if (reportData) {
            outStr +=
              "X:" +
              parseFloat(screenPos.x).toFixed(3) +
              ", " +
              "Y:" +
              parseFloat(screenPos.y).toFixed(3) +
              ", " +
              "P:" +
              parseFloat(pressure).toFixed(3) +
              ", " +
              "Tx:" +
              parseFloat(tilt.x).toFixed(3) +
              ", " +
              "Ty:" +
              parseFloat(tilt.y).toFixed(3) +
              ", " +
              "R:" +
              parseFloat(rotate).toFixed(3) +
              ", " +
              "B:" +
              buttons +
              "<br>";

            setTimeout(function () {
              delayedInnerHTMLFunc(outStr);
            }, 100);
          }
        }
      }

      /////////////////////////////////////////////////////////////////////////
      // Show the device data in output element.
      //
      delayedInnerHTMLFunc = function (str) {
        reportElem.innerHTML += str;
        reportElem.scrollIntoView(false); // scroll to bottom
      };

      /////////////////////////////////////////////////////////////////////////
      // These event handlers are set up once when the page is loaded.
      // Note that there are two alternate sets of handlers depending on whether
      // PointerEvents are handled.
      //
      if (supportsPointerEvents) {
        // if Pointer Events are supported, only listen to pointer events
        for (var idx = 0; idx < pointerEvents.length; idx++) {
          myCanvas.addEventListener(
            pointerEvents[idx],
            pointerEventDraw,
            false
          );
        }
      } else {
        // traditional mouse/touch/pen event handlers
        for (var idx = 0; idx < events.length; idx++) {
          myCanvas.addEventListener(events[idx], eventDraw, false);
        }
      }
    },
    true
  ); // end window.addEventListener
  for (let i = 0; i < examData.length - 1; i++) {
    let diffX = examData[i + 1][0] - examData[i][0];
    let diffY = examData[i + 1][1] - examData[i][1];
    let difft = examData[i + 1][3] - examData[i][3];
    let velocity = Math.sqrt(diffX ** 0.5 / difft + diffY ** 0.5 / difft);
    velocityData.push([examData[i][0], examData[i][1], velocity]);
  }
  console.log("exame", examData);
  console.log("velocidade", velocityData);

  return res.render("exams/index", { exams: data.exams });
};
/////////////////////////////////////////////////////////////////////////
