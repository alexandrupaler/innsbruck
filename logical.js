/*
  The initial diagram
*/
var cy = cytoscape({
  container: document.getElementById('cy') // container to render in

});

/*
    The graph of the diagram
 */
var cygraph = cytoscape({
  container: document.getElementById('cygraph'), // container to render in
  
  layout: {
    name: 'circle',
    radius: 100
  }
});

/*
    The reconstructed diagram
 */
var cyrecon = cytoscape({
    container: document.getElementById('cyrecon') // container to render in

});
stringStylesheet = 'node { height: 10; width: 10; background-color: blue;} edge{ width: 10;}';
cyrecon.style(stringStylesheet);

/*
  Global parameters and variables
*/
var distance = 40;
var maxi = 10;
var adjacencyList = new Array();

cy.randomColors = new Array();
cyrecon.randomColors = new Array();

//var doNotUse = new Array();
cy.doNotUse = new Array();
cyrecon.doNotUse = new Array();


function getRandomColor()
{
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) 
    {
        color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
}

function recalculateColors()
{
    for (var i = 0; i < maxi - 1; i++) {
        cy.randomColors[i] = getRandomColor();
    }
}

function getId(i, j)
{
  return i + "," + j;
}

function canUse(cyel, id)
{
  return cyel.doNotUse[ id ] != 1;
}

/*
  Graph manipulations
*/

function addTriangleNode(triangle, i, j, label)
{
    var node = triangle.add({
        group: "nodes",
        data: { id: i + "," + j},
        position: { y: distance * i + 60, x: distance * j + 60}
    }).lock();

    if(j != 0 && i == 0)
    {
        node.style("label", label);
    }

    return node;
}

function addTriangleRow(cyel, i)
{
    cyel.doNotUse[getId(i, i)] = 1;
    nodeClicked( addTriangleNode(cyel, i, i, i) );
    
    for (var j = i + 1; j < maxi; j++)
    {
        addTriangleNode(cyel, i, j, j);
    }
}

function createGraph()
{
  /*
    The graph corresponding to the triangle
  */
  var stringStylesheet = "node { height: 40; width: 40; background-color: orange; label: data(id);}  edge{ width: 2;}";
  cygraph.style(stringStylesheet);
  
  cygraph.remove(cygraph.nodes());

  for(var i = 1; i < maxi; i++)
  {
    cygraph.add({
      group: "nodes",
      data: { id: i}
    });
  }
  
  var layout = cygraph.layout({
    name: 'circle',
  });
  
  layout.run();
  
  /*
  The triangle on the left 
  */
  stringStylesheet = 'node { height: 20; width: 20; background-color: blue;} edge{ width: 20;}';
  cy.style(stringStylesheet);
  
  cy.remove(cy.nodes());
  
  for(var i = 0; i <  maxi; i++)
  {
    addTriangleRow(cy, i);
  }
}

function addGraphEdge(k, l, lineNr)
{
  var adj = adjacencyList[ getId(k, l) ];
  if( adj == undefined)
  {
    adj = new Array();
    
    adj.push(lineNr);
    adjacencyList[ getId(k, l) ] = adj;
  }
  else
  {
    adj.push(lineNr);
    adjacencyList[ getId(k, l) ] = adj;
    
    //assume that only two elements exist in adj
    //does not check if the edge is already there
     cygraph.add({
        group: "edges", 
        data: { source: adj[0], target: adj[1] }
     });
     
    theBigMatrix[ adj[0]] [ adj[1] ] ++;
    theBigMatrix[ adj[1]] [ adj[0] ] ++;
  }
}

function addEdge(cy, i, j, k, l)
{
  return cy.add({
    group: "edges", 
    data: { source: i+","+j, target: k+","+l }
  });
}

/*
lastcolumn is more like a node
 */
function drawSingleLine(cyel, startingNode, lastColumn, drawGraphEdge)
{
    var prevLine = 0;
    var prevCol = startingNode;

    var changedDirection = false;

    for (var j = 1; j < lastColumn; j++) {
        var line = j;
        var col = prevCol;

        if (changedDirection) {
            line = prevLine;
            col = j;
        }

        if (!canUse(cyel, getId(line, col)))
        {
            changedDirection = !changedDirection;

            if (changedDirection) {
                col += 1;
                j = col;
            }
            else {
                line += 1;
                j = line;
            }
        }

        if (!canUse(cyel, getId(line, col))) {
            //the escape is not working
            break;
        }

        if (line < maxi && col < maxi) {
            addEdge(cyel, prevLine, prevCol, line, col)
                .css("line-color", cyel.randomColors[startingNode - 1]);/*color numbers are from zero*/

            if(drawGraphEdge)
            {
                addGraphEdge(line, col, startingNode);
            }
        }

        prevLine = line;
        prevCol = col;
    }

    return {prevLine: prevLine, prevCol: prevCol, changedDirection: changedDirection, j: j, line: line, col: col};
}
function drawAnnealerLines()
{
  cy.remove(cy.edges());
  cygraph.remove(cygraph.edges());

  adjacencyList = new Array();
  createBigMatrix();
  
  for( var i = 1; i < maxi; i++)
  {
      drawSingleLine(cy, i, maxi, true);
  }

  /*
    This calls the reconstruction
   */
  drawEntireTriangle(cyrecon, runAnalysis());
}

function nodeClicked(target)
{
  if( target.block == undefined)
  {
    target.block = true;
  }
  else
  {
    target.block = !target.block;
  }
    
  if(target.block)
  {
    target.css('shape', 'triangle');
  }
  else
  {
    target.css('shape', 'ellipse');
  }
} 

/*
  Event handler for clicking nodes
*/

cyrecon.on('tap', 'node', function(evt) {
    console.log('recon ' + evt.target.id());
});

cy.on('tap', 'node', function(evt)
{
  //console.log( 'tap ' + evt.target.id() );
    //check if on diagonal
    var sp = evt.target.id().split(",");
    if(sp[0] == sp[1])
    {
        return;
    }

    nodeClicked(evt.target);

    if(!canUse(cy, evt.target.id()))
    {
        delete cy.doNotUse[evt.target.id()];
        //console.log(canUse(cy, evt.target.id()));
    }
    else
    {
        cy.doNotUse [ evt.target.id() ] = 1;
    }

    drawAnnealerLines();
});

function changeMaxi(val)
{
  maxi = val;
  //do this because the maxi value can be changed from matrix input
  document.getElementById("nrfield").value = maxi;
  
  //Select the colors for the paths
  cy.randomColors = new Array();
  cyrecon.randomColors = new Array();

  recalculateColors();

  /*
    reinitialise the array of defects
   */
  cy.doNotUse = new Array();

  createGraph();
}

/*
  Main
*/

changeMaxi(maxi);
drawAnnealerLines();














