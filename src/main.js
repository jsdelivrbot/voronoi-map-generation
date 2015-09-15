var container, renderer, graphics;
var i,j;

var selectedTileBoundaryGraphics;

/* 
	shape.hitArea = new PIXI.Polygon(vertices);
shape.interactive = true;

shape.click = function(mouseData){
   console.log("MOUSE CLICK " + shape.hexId);
}

In order to make them interactive polygons

*/
 
function distance(a, b) {
    var dx = a.x-b.x,
        dy = a.y-b.y;
    return Math.sqrt(dx*dx+dy*dy);
}

function cellArea(cell) {
    var area = 0,
        halfedges = cell.halfedges,
        iHalfedge = halfedges.length,
        halfedge,
        p1, p2;
    while (iHalfedge--) {
        halfedge = halfedges[iHalfedge];
        p1 = halfedge.getStartpoint();
        p2 = halfedge.getEndpoint();
        area += p1.x * p2.y;
        area -= p1.y * p2.x;
    }
    area /= 2;
    return area;
}

function cellCentroid(cell) {
    var x = 0, y = 0,
        halfedges = cell.halfedges,
        iHalfedge = halfedges.length,
        halfedge,
        v, p1, p2;
    while (iHalfedge--) {
        halfedge = halfedges[iHalfedge];
        p1 = halfedge.getStartpoint();
        p2 = halfedge.getEndpoint();
        v = p1.x*p2.y - p2.x*p1.y;
        x += (p1.x+p2.x) * v;
        y += (p1.y+p2.y) * v;
    }
    v = cellArea(cell) * 6;
    return {x:x/v,y:y/v};
}

function init() {
    var viewport = document.getElementById("viewport");

    var viewportWidth = viewport.offsetWidth,
        viewportHeight = viewport.offsetHeight;

    container = new PIXI.Container();
	renderer = new PIXI.WebGLRenderer(viewportWidth, viewportHeight);
   
    while (viewport.firstChild) {
        viewport.removeChild(viewport.firstChild);
    }
    viewport.appendChild(renderer.view);
    requestAnimationFrame( animate );
    
    var voronoi = new Voronoi();
    var bbox = {xl: 0, xr: viewportWidth, yt: 0, yb: viewportHeight};
    var sites = [];
    
    for(i = 4096; i--; ) {
   		var tx = 0;
        var ty = 0;
        
        tx = Math.random() * viewportWidth;
        ty = Math.random() * viewportHeight;
        
        sites.push({x: tx, y: ty});
    }
    
    var diagram = voronoi.compute(sites, bbox);
    
    for(i = 3; i--; 0) {
        sites = [];
        var cells = diagram.cells,
            iCell = cells.length,
            cell,
            site,
            again = false,
            rn, dist;
        var p = 1 / iCell * 0.1;
        while (iCell--) {
            cell = cells[iCell];
            rn = Math.random();
            // probability of apoptosis
            if (rn < p) {
                continue;
            }
            site = cellCentroid(cell);
            dist = distance(site, cell.site);
            // don't relax too fast
            if (dist > 2) {
                site.x = (site.x+cell.site.x)/2;
                site.y = (site.y+cell.site.y)/2;
            }
            // probability of mytosis
            if (rn > (1-p)) {
                dist /= 2;
                sites.push({
                    x: site.x+(site.x-cell.site.x)/dist,
                    y: site.y+(site.y-cell.site.y)/dist,
                });
            }
            sites.push(site);
        }
        voronoi.recycle(diagram);
        diagram = voronoi.compute(sites, bbox);
    }

    for(i = 0; i < diagram.cells.length; i++) {
        var cell = diagram.cells[i],
            points = [],
            halfedges = cell.halfedges,
            iHalfedge = halfedges.length,
            point;

        while (iHalfedge--) {
            point = halfedges[iHalfedge].getStartpoint();
            points.push(point.x);
            points.push(point.y);
        }

        graphics = new PIXI.Graphics();

        graphics.mapTileId = i;
        graphics.mapPoints = points;

        graphics.beginFill(1862560 + (Math.random() * 75));
        graphics.lineStyle(1.5, 0x323232, 1);

        graphics.drawPolygon(points);

        for(j = 0; j < points.length; j += 2) {
            if(j === 0) graphics.moveTo(points[j], points[j + 1]);
            else {
                graphics.lineTo(points[j], points[j + 1]);
                if(j !== points.length - 1) {
                    graphics.moveTo(points[j], points[j + 1]);
                }
            }
        }

        graphics.endFill();
        container.addChild(graphics);

        graphics.interactive = true;
        graphics.click = handleCellClick;
    }
}

function handleCellClick(cell) {
    var points = cell.target.mapPoints;

    container.removeChild(selectedTileBoundaryGraphics);

    selectedTileBoundaryGraphics = new PIXI.Graphics();
    selectedTileBoundaryGraphics.lineStyle(3, 0xFFFF00, 1);

    for(j = 0; j < points.length; j += 2) {
        if(j === 0) selectedTileBoundaryGraphics.moveTo(points[j], points[j + 1]);
        else {
            selectedTileBoundaryGraphics.lineTo(points[j], points[j + 1]);
            selectedTileBoundaryGraphics.moveTo(points[j], points[j + 1]);
            if(j === points.length - 2) {
                selectedTileBoundaryGraphics.lineTo(points[0], points[1]);
            }
        }
    }

    container.addChild(selectedTileBoundaryGraphics);
}

function animate() {
    requestAnimationFrame( animate );
    renderer.render(container);
}

window.onload = init;
window.addEventListener("resize", init);