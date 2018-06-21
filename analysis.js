function sortLengths(a, b)
{

    var dif = (a.latestUse - b.latestUse);

    if(dif == 0)
    {
        dif = - (a.len - b.len);
    }


    /*
    var dif = - (a.len - b.len);

    if(dif == 0)
    {
        dif = -(a.latestUse - b.latestUse);
    }
    */

    return dif;
}

function randomGraph(val, failprob)
{
    console.clear();

    var prob = failprob;
    maxi = val;

   if(cy.randomColors.length < maxi)
   {
       recalculateColors();
   }

    createBigMatrix();

    //delete all edges
    cygraph.remove(cygraph.edges());

    //delete all nodes

    createGraph();

    for(var i=1; i<maxi; i++)
    {
        theBigMatrix[0][i] = i;
        theBigMatrix[i][0] = i;

        for(var j=i + 1; j<maxi; j++)
        {
            if(Math.random() < prob)
            {
                cygraph.add({
                    group: "edges",
                    data: { source: i, target: j }
                });

                theBigMatrix[ i ] [ j ] ++;
                theBigMatrix[ j ] [ i ] ++;
            }
        }
    }

    drawEntireTriangle(cyrecon, runAnalysis());
}

function runAnalysis()
{
    //clear the matrix details
    document.getElementById('matrix').innerHTML = "";

/*
    cygraph.elements("edge:selected")
        .css({
            'width': 5
        });
*/

    var l = cygraph.nodes();
    var nodeDegrees = new Array();
    for ( var i = 0; i < l.size(); i++)
    {
        var lenobj = { id : 0, len : 0, latestUse : 0};
        lenobj.id = l[i].id();
        lenobj.len = l[i].neighborhood("node").size();

        lenobj.latestUse = 0;

        nodeDegrees.push(lenobj);
    }

    nodeDegrees.sort(sortLengths);

    /*Include bellman ford*/

    var bf = cygraph.elements().bellmanFord({ root: "#" + nodeDegrees[0].id });
    for ( var i = 0; i < l.size(); i++) {
        nodeDegrees[i].latestUse = bf.distanceTo("#" + nodeDegrees[i].id);
    }

    //nodeDegrees.sort(sortLengths);

    var str = "";
    var total = 0;
    for (var i = 1; i < maxi; i++)
    {
        //translate i
        var translatedI = nodeDegrees[i-1].id;

        str += translatedI + " ";

        var distEnd1 = 0;

        var nghs = new Array();
        var missing = new Array();

        for(var j = i+1; j < maxi; j++)
        {
            //translate j
            var translatedJ = nodeDegrees[j -  1].id;

            if(theBigMatrix[ translatedI ] [ translatedJ ] != 0)
            {
                nghs.push(translatedJ);

                distEnd1 = maxi - (j + 1);

                nodeDegrees[j -  1].latestUse = i;
            }
            else
            {
                missing.push(translatedJ);
            }
        }
        //str += nghs + " (" + nghs.length + "), missing " + missing + " distend1 " + distEnd1 + "\n";
        str += nghs + " (" + nghs.length + ") distend1 " + distEnd1 + "\n";
        total += nghs.length;

        nodeDegrees[i - 1].nghs = nghs;
        nodeDegrees[i - 1].missing = missing;
    }

    //this does not work
    //nodeDegrees.sort(sortLengths);

    document.getElementById('matrix').
        appendChild(document.createTextNode(str + "-----------\n" + "total:" + total + "\n"));

    writeBigMatrix();

    return nodeDegrees;
}

function usedInInterval(nodeDegrees, kNodeId, start, stop) {
    var notUsed = true;
    for (var kk = start + 1; kk < stop; kk++) {
        if (nodeDegrees[kk].processed == false
            && nodeDegrees[kk].nghs.indexOf(kNodeId) != -1) {
            notUsed = false;
            break;
        }
    }
    return {kNodeId: kNodeId, notUsed: notUsed, kk: kk};
}
function blockUsage(idToBlock) {
    if (canUse(cyrecon, idToBlock)) {
        cyrecon.doNotUse[idToBlock] = 1;
        //the ids contain a comma which needs to be escaped with \\
        nodeClicked(cyrecon.$('#' + idToBlock.replace(",", "\\,")));
    }
}
function drawEntireTriangle(cyel, nodeDegrees)
{
    console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");

    cyel.doNotUse = new Array();

    /*
        take the colors from cy. if  cyel == cy, then nothing is changed
     */
    for(var i = 0; i < maxi - 1; i++)
    {
        cyel.randomColors[i] = cy.randomColors[nodeDegrees[i].id - 1];
    }

    var mapIdPositions = new Array();
    var offsets = new Array();

    for(var idx = 0; idx < nodeDegrees.length; idx++)
    {
        mapIdPositions [ nodeDegrees[ idx ].id ] = idx;// + 1;

        //dynamically append this attributed to the objects
        //true - was drawn, false - can be drawn
        nodeDegrees[idx].processed = false;

        offsets[idx] = 0;
    }

    stringStylesheet = 'node { height: 20; width: 20; background-color: blue;} edge{ width: 20;}';
    cyel.style(stringStylesheet);
    cyel.remove(cyel.nodes());

    /*
    place the starting nodes
     */
    for(var idx = 0; idx < nodeDegrees.length; idx++)
    {
        addTriangleNode(cyel, 0, idx + 1, nodeDegrees[idx].id);
    }
    nodeClicked( addTriangleNode(cyel, 0, 0, 0 /*nolabel*/) );

    /*
    start the drawing procedure
     */
    for(var idx = 0; idx < nodeDegrees.length; idx++)
    {
        addTriangleRow(cyel, idx + 1);
    }

    var finalLine = false;
    for(var idx = 0; idx < nodeDegrees.length; idx++)
    {

        if(nodeDegrees[idx].processed == true)
        {
            continue;
        }

        console.log("@ " + nodeDegrees[idx].id);

        var atThisIndexToDraw = new Array();
        var noneCanBeUsed = false;
        var lineNr = idx;

        while(!noneCanBeUsed)
        {
            noneCanBeUsed = true;

            /*
             check the last column this line will reach
             */
            var lastIntersectionColumn = -1;
            if (nodeDegrees[lineNr].nghs.length > 0)
            {
                var lastIntersectionNode = nodeDegrees[lineNr].nghs [nodeDegrees[lineNr].nghs.length - 1];
                lastIntersectionColumn = mapIdPositions [lastIntersectionNode];
            }
            else
            {
                /*
                 if the current line has no neighbours
                 */
                lastIntersectionColumn = lineNr;
            }

            /*
            save the details of the line to draw
             */
            //in order to get over a strange bug
            //var toDraw = {idx : lineNr, last : lastIntersectionColumn};
            var toDraw = [lineNr, lastIntersectionColumn];
            atThisIndexToDraw.push(toDraw);

            /*
            check if there is another line which can be squeezed on this triangle row
             */
            //for (var k = lastIntersectionColumn + 1; k < maxi; k++)
            for (var k = lastIntersectionColumn + 1; k < nodeDegrees.length; k++)
            {
                /*
                 check if the current element is still used in any other node
                 */
                //if (nodeDegrees[k - 1].processed == true)
                if (nodeDegrees[k].processed == true)
                {
                    continue;
                }

                var kNodeId = nodeDegrees[k].id;

                var __ret = usedInInterval(nodeDegrees, kNodeId, idx, nodeDegrees.length);
                var notUsed = __ret.notUsed;

                /*
                a line was found which can be squeezed
                 */
                if (notUsed) {

                    /*
                    mark it in the corresponding doNotUse
                    this effectively blocks the line when moving down and makes it go to the right
                     */
                    var idToBlock = getId(idx + 1 - offsets[idx], k + 1);
                    console.log("    " + kNodeId + " could be used -> block " + idToBlock);
                    blockUsage(idToBlock);

                    /*
                    update lastIntersectionColumn
                     */
                    atThisIndexToDraw[atThisIndexToDraw.length - 1][1] = k - 1;

                    noneCanBeUsed = false;

                    /*
                    update lineNr and break;
                    this will force a new search of a column where lineNr ends
                    */
                    lineNr = k;

                    break;
                }
            }
        }

        //advance the idx to skip over already processed entries
        var newIdx = idx + 1;
        while(newIdx < nodeDegrees.length
            && (nodeDegrees[newIdx].processed == true
                || nodeDegrees[newIdx].nghs.length == 0))
        {
            newIdx++;
        }
        /*
        the last line will go to maxi
         */
        //commented this and added: if(i == atThisIndexToDraw.length - 1 /*the last line*/)
        if(newIdx < nodeDegrees.length - 1)
        {
            atThisIndexToDraw[atThisIndexToDraw.length - 1][1] = maxi;
        }
        else
        {
            finalLine = true;
        }

        /*
        draw the lines
         */
        var tmpoffsets = offsets;

        for(var i = 0; i < atThisIndexToDraw.length; i++)
        {
            var lineId = atThisIndexToDraw[i][0];
            var toColumn = atThisIndexToDraw[i][1];

            var name = nodeDegrees[lineId].id;

            if(nodeDegrees[lineId].nghs.length == 0)
            {
                console.log("    check if allowed to place second block");

                var nextToProcess = ( (lineId + 1) == idx );
                var nextToDraw = (i+1 < atThisIndexToDraw.length) && ( atThisIndexToDraw[i + 1][0] == lineId );
                var wasProcessed = (lineId + 1 < nodeDegrees.length) && nodeDegrees[lineId + 1].processed;

                if(nextToDraw || nextToProcess || wasProcessed)
                {
                    var idToBlock = getId(idx + 1 - offsets[idx], lineId + 2);
                    console.log("    ... " + name + " has zero ngh -> block " + idToBlock + " " + nextToDraw + " " +  nextToProcess + " " + wasProcessed);
                    blockUsage(idToBlock);
                }
            }

            /*if(finalLine)
            {
                var idToBlock = getId(idx + 1 - offsets[lineId], toColumn + 1);
                console.log("    ... " + name + " is the last one -> block " + idToBlock);
                blockUsage(idToBlock);
            }*/

            console.log("    draw " + name + "with offset " + offsets[lineId]);

            drawSingleLine(cyel,
                lineId + 1,
                toColumn + 2 - offsets[lineId],
                false);

            nodeDegrees[lineId].processed = true;

            if(i > 0/* || nodeDegrees[lineId].nghs.length == 0*/)
            {
                for(var oi = lineId + 1; oi < nodeDegrees.length; oi++)
                {
                    //tmpoffsets[oi]++;
                }
            }
        }

        offsets = tmpoffsets;
    }
}

/*
 var bfs = cygraph.elements().bfs({
 roots: "#" + nodeDegrees[0].id,
 visit: function(v, e, u, i, depth)
 {
 //console.log( 'visit ' + v.id() + ' ' + depth);
 },

 directed: false
 });

 var path = bfs.path;
 // select the path
 path.select();
 */

/*
 0 1 2 3 4 5 6 7 8 9
 1 0 0 1 0 0 0 0 0 0
 2 0 0 1 1 1 1 1 1 1
 3 1 1 0 0 1 0 1 1 1
 4 0 1 0 0 0 0 0 0 0
 5 0 1 1 0 0 0 0 0 0
 6 0 1 0 0 0 0 0 0 1
 7 0 1 1 0 0 0 0 1 1
 8 0 1 1 0 0 0 1 0 0
 9 0 1 1 0 0 1 1 0 0
 */

/*
 0 1 2 3 4 5 6 7 8 9
 1 0 1 0 0 0 0 0 0 0
 2 1 0 1 0 1 0 0 0 1
 3 0 1 0 0 1 0 1 1 1
 4 0 0 0 0 1 0 1 0 1
 5 0 1 1 1 0 1 1 1 1
 6 0 0 0 0 1 0 0 1 1
 7 0 0 1 1 1 0 0 0 1
 8 0 0 1 0 1 1 0 0 0
 9 0 1 1 1 1 1 1 0 0
 */
/*
0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22
1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
2 0 0 1 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0
3 1 1 0 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 0 0
4 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0
5 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0
6 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0
7 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0
8 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 1 0 0 1 0 0
9 0 0 0 0 0 0 0 0 0 0 1 1 0 1 1 1 1 0 0 0 0 0
10 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0
11 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 0
12 0 0 1 0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0
13 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
14 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0
15 0 0 0 0 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1
16 0 0 1 1 0 0 0 0 1 0 0 0 0 0 0 0 0 0 1 0 0 0
17 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 1 0 0 0 0
18 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0
19 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 1 0
20 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0
21 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0
22 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0
*/

/*
 0 1 2 3 4 5 6 7 8 9
 1 0 1 0 0 0 1 1 0 0
 2 1 0 0 0 1 1 1 1 0
 3 0 0 0 1 0 0 0 0 1
 4 0 0 1 0 0 0 0 1 0
 5 0 1 0 0 0 0 1 0 0
 6 1 1 0 0 0 0 1 0 0
 7 1 1 0 0 1 1 0 1 0
 8 0 1 0 1 0 0 1 0 0
 9 0 0 1 0 0 0 0 0 0
 */