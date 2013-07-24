/// <reference path="CaseModel.ts" />
/// <reference path="CaseDecoder.ts" />
/// <reference path="Layout.ts" />
/// <reference path="../plugins/SamplePlugin.ts" />
/// <reference path="../d.ts/jquery.d.ts" />
/// <reference path="../d.ts/pointer.d.ts" />

/* VIEW (MVC) */

class HTMLDoc {
	DocBase: JQuery;
	Width: number = 0;
	Height: number = 0;

	Render(Viewer: CaseViewer, CaseModel: CaseModel): void {
		if (this.DocBase != null) {
			var parent = this.DocBase.parent();
			if (parent != null) parent.remove(this.DocBase);
		}
		this.DocBase = $('<div class="node">').css("position", "absolute");
		this.DocBase.append($('<h4>' + CaseModel.Label + '</h4>'));
		this.DocBase.append($('<p>' + CaseModel.Statement + '</p>'));
		this.InvokePlugInRender(Viewer, CaseModel, this.DocBase);
		this.UpdateWidth(Viewer, CaseModel);
		this.Resize(Viewer, CaseModel);
	}

	UpdateWidth(Viewer: CaseViewer, Source: CaseModel) {
		this.DocBase.width(CaseViewer.ElementWidth);
		switch (Source.Type) {
			case CaseType.Goal:
				this.DocBase.css("padding", "5px 10px");
				break;
			case CaseType.Context:
				this.DocBase.css("padding", "10px 10px");
				break;
			case CaseType.Strategy:
				this.DocBase.css("padding", "5px 20px");
				break;
			case CaseType.Evidence:
			default:
				this.DocBase.css("padding", "20px 20px");
				break;
		}
		this.DocBase.width(CaseViewer.ElementWidth * 2 - this.DocBase.outerWidth());
	}

	InvokePlugInRender(CaseViewer: CaseViewer, CaseModel: CaseModel, DocBase: JQuery): void {
		for (var anno in CaseModel.Annotations) {
			var f = CaseViewer.GetPlugInRender(anno.Name);
			DocBase.append(f(CaseViewer, CaseModel, anno));
		}
		for (var note in CaseModel.Notes) {
			var f = CaseViewer.GetPlugInRender(note.Name);
			DocBase.append(f(CaseViewer, CaseModel, note));
		}
	}

	Resize(Viewer: CaseViewer, Source: CaseModel): void {
		this.Width = this.DocBase ? this.DocBase.outerWidth() : 0;
		this.Height = this.DocBase ? this.DocBase.outerHeight() : 0;
	}

	SetPosition(x: number, y: number) {
		this.DocBase.css({ left: x + "px", top: y + "px" });
	}
}

class Point {
	constructor(public x: number, public y: number) { }
}

enum Direction {
	Right, Left, Top, Bottom
}

class SVGShape {
	Width: number;
	Height: number;
	ShapeGroup: SVGGElement;
	ArrowPath: SVGPathElement;

	Render(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		this.ShapeGroup = <SVGGElement>document.createSVGElement("g");
		this.ShapeGroup.setAttribute("transform", "translate(0,0)");
		this.ArrowPath = <SVGPathElement>document.createSVGElement("path");
		this.ArrowPath.setAttribute("marker-end", "url(#Triangle-black)");
		this.ArrowPath.setAttribute("fill", "none");
		this.ArrowPath.setAttribute("stroke", "gray");
		this.ArrowPath.setAttribute("d", "M0,0 C0,0 0,0 0,0");
	}

	Resize(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		this.Width = HTMLDoc.Width;
		this.Height = HTMLDoc.Height;
	}

	SetPosition(x: number, y: number) {
		var mat = this.ShapeGroup.transform.baseVal.getItem(0).matrix;
		mat.e = x;
		mat.f = y;
	}

	SetArrowPosition(x1: number, y1: number, x2: number, y2: number) {
		var start = <SVGPathSegMovetoAbs>this.ArrowPath.pathSegList.getItem(0);
		var curve = <SVGPathSegCurvetoCubicAbs>this.ArrowPath.pathSegList.getItem(1);
		start.x = x1;
		start.y = y1;
		curve.x = x2;
		curve.y = y2;
		curve.x1 = (9 * x1 + x2) / 10;
		curve.y1 = (y1 + y2) / 2;
		curve.x2 = (9 * x2 + x1) / 10;
		curve.y2 = (y1 + y2) / 2;
	}

	SetColor(fill: string, stroke: string) {
	}

	GetConnectorPosition(Dir: Direction): Point {
		switch (Dir) {
			case Direction.Right:
				return new Point(this.Width, this.Height / 2);
			case Direction.Left:
				return new Point(0, this.Height / 2);
			case Direction.Top:
				return new Point(this.Width / 2, 0);
			case Direction.Bottom:
				return new Point(this.Width / 2, this.Height);
			default:
				return new Point(0, 0);
		}
	}
}

class GoalShape extends SVGShape {
	BodyRect: SVGRectElement;

	Render(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Render(CaseViewer, CaseModel, HTMLDoc);
		this.BodyRect = <SVGRectElement>document.createSVGElement("rect");

		this.ShapeGroup.appendChild(this.BodyRect);
		this.Resize(CaseViewer, CaseModel, HTMLDoc);
	}

	Resize(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Resize(CaseViewer, CaseModel, HTMLDoc);
		this.BodyRect.setAttribute("width", this.Width.toString());
		this.BodyRect.setAttribute("height", this.Height.toString());
	}

	SetColor(fill: string, stroke: string) {
		this.BodyRect.setAttribute("fill", fill);
		this.BodyRect.setAttribute("stroke", stroke);
	}
}

class ContextShape extends SVGShape {
	BodyRect: SVGRectElement;

	Render(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Render(CaseViewer, CaseModel, HTMLDoc);
		this.BodyRect = <SVGRectElement>document.createSVGElement("rect");
		this.BodyRect.setAttribute("rx", "10");
		this.BodyRect.setAttribute("ry", "10");
		this.ShapeGroup.appendChild(this.BodyRect);
		this.Resize(CaseViewer, CaseModel, HTMLDoc);
	}

	Resize(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Resize(CaseViewer, CaseModel, HTMLDoc);
		this.BodyRect.setAttribute("width", this.Width.toString());
		this.BodyRect.setAttribute("height", this.Height.toString());
	}

	SetColor(fill: string, stroke: string) {
		this.BodyRect.setAttribute("fill", fill);
		this.BodyRect.setAttribute("stroke", stroke);
	}
}

class StrategyShape extends SVGShape {
	BodyPolygon: SVGPolygonElement;

	Render(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Render(CaseViewer, CaseModel, HTMLDoc);
		this.BodyPolygon = <SVGPolygonElement>document.createSVGElement("polygon");
		this.ShapeGroup.appendChild(this.BodyPolygon);
		this.Resize(CaseViewer, CaseModel, HTMLDoc);
	}

	Resize(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Resize(CaseViewer, CaseModel, HTMLDoc);
		this.BodyPolygon.setAttribute("points", "10,0 " + this.Width + ",0 " + (this.Width - 10) + "," + this.Height + " 0," + this.Height);
	}

	SetColor(fill: string, stroke: string) {
		this.BodyPolygon.setAttribute("fill", fill);
		this.BodyPolygon.setAttribute("stroke", stroke);
	}

	GetConnectorPosition(Dir: Direction): Point {
		switch (Dir) {
			case Direction.Right:
				return new Point(this.Width - 10 / 2, this.Height / 2);
			case Direction.Left:
				return new Point(10 / 2, this.Height / 2);
			case Direction.Top:
				return new Point(this.Width / 2, 0);
			case Direction.Bottom:
				return new Point(this.Width / 2, this.Height);
			default: 
				return new Point(0, 0);
		}
	}
}

class EvidenceShape extends SVGShape {
	BodyEllipse: SVGEllipseElement;

	Render(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Render(CaseViewer, CaseModel, HTMLDoc);
		this.BodyEllipse = <SVGEllipseElement>document.createSVGElement("ellipse");
		this.ShapeGroup.appendChild(this.BodyEllipse);
		this.Resize(CaseViewer, CaseModel, HTMLDoc);
	}

	Resize(CaseViewer: CaseViewer, CaseModel: CaseModel, HTMLDoc: HTMLDoc): void {
		super.Resize(CaseViewer, CaseModel, HTMLDoc);
		this.BodyEllipse.setAttribute("cx", (this.Width / 2).toString());
		this.BodyEllipse.setAttribute("cy", (this.Height / 2).toString());
		this.BodyEllipse.setAttribute("rx", (this.Width / 2).toString());
		this.BodyEllipse.setAttribute("ry", (this.Height / 2).toString());
	}

	SetColor(fill: string, stroke: string) {
		this.BodyEllipse.setAttribute("fill", fill);
		this.BodyEllipse.setAttribute("stroke", stroke);
	}
}

class SVGShapeFactory {
	static Create(Type: CaseType): SVGShape {
		switch (Type) {
			case CaseType.Goal:
				return new GoalShape();
			case CaseType.Context:
				return new ContextShape();
			case CaseType.Strategy:
				return new StrategyShape();
			case CaseType.Evidence:
				return new EvidenceShape();
		}
	}
}

interface JQuery {
	svg(loadUrl: string): JQuery;
	svg(x: Function): JQuery;
}

interface Document {
	createSVGElement: (name: string) => Element;
}

document.createSVGElement = function (name: string): Element {
	return document.createElementNS('http://www.w3.org/2000/svg', name);
}

class ElementShape {
	CaseViewer: CaseViewer;
	Source: CaseModel;
	HTMLDoc: HTMLDoc;
	SVGShape: SVGShape;
	ParentShape: ElementShape;

	AbsX: number = 0;
	AbsY: number = 0;
	x: number = 0;
	y: number = 0;

	constructor(CaseViewer: CaseViewer, CaseModel: CaseModel) {
		this.CaseViewer = CaseViewer;
		this.Source = CaseModel;
		this.HTMLDoc = new HTMLDoc();
		this.HTMLDoc.Render(CaseViewer, CaseModel);
		this.SVGShape = SVGShapeFactory.Create(CaseModel.Type);
		this.SVGShape.Render(CaseViewer, CaseModel, this.HTMLDoc);
	}

	Resize(): void {
		this.HTMLDoc.Resize(this.CaseViewer, this.Source);
		this.SVGShape.Resize(this.CaseViewer, this.Source, this.HTMLDoc);
	}

	AppendHTMLElement(svgroot: JQuery, divroot: JQuery): void {
		divroot.append(this.HTMLDoc.DocBase);
		this.HTMLDoc.SetPosition(this.AbsX, this.AbsY);
		this.Resize();
		// TODO
		// if it has an parent, add an arrow element. 
		svgroot.append(this.SVGShape.ShapeGroup);
		this.SVGShape.SetPosition(this.AbsX, this.AbsY);
		this.SVGShape.SetColor("white", "black");

		if (this.ParentShape != null) {
			var p1 = this.ParentShape.GetAbsoluteConnectorPosition(Direction.Bottom);
			var p2 = this.GetAbsoluteConnectorPosition(Direction.Top);
			this.SVGShape.SetArrowPosition(p1.x, p1.y, p2.x, p2.y);
			svgroot.append(this.SVGShape.ArrowPath);
		}
		return; // TODO
	}

	GetAbsoluteConnectorPosition(Dir: Direction): Point {
		var p = this.SVGShape.GetConnectorPosition(Dir);
		p.x += this.AbsX;
		p.y += this.AbsY;
		return p;
	}
}

class CaseViewerConfig {

}

var ViewerConfig = new CaseViewerConfig();

class CaseViewer {
	ViewMap: { [index: string]: ElementShape; };
	ElementTop : CaseModel;
	static ElementWidth = 150;

	constructor(Source: Case) {
		this.ViewMap = <any>[]; // a hack to avoid tsc's problem.
		for (var elementkey in Source.ElementMap) {
			var element = Source.ElementMap[elementkey];
			this.ViewMap[element.Label] = new ElementShape(this, element);
		}
		for (var elementkey in Source.ElementMap) {
			var element = Source.ElementMap[elementkey];
			if (element.Parent != null) {
				this.ViewMap[element.Label].ParentShape = this.ViewMap[element.Parent.Label];
			}
		}
		this.ElementTop = Source.ElementTop;
		this.Resize();
	}

	GetPlugInRender(Name: string): (CaseViewer: CaseViewer, CaseModel: CaseModel, Node: string) => string {
		return null; // TODO;
	}

	Resize(): void {
		for (var shapekey in this.ViewMap) {
			this.ViewMap[shapekey].Resize();
		}
		this.LayoutElement();
	}

	LayoutElement() : void {
//		var layout : Layout = new LayoutPortrait(this.ViewMap); //TODO Enable switch Layout engine
//		layout.Init(this.ElementTop, 300, 0);
//		layout.Traverse(this.ElementTop, 300, 0);
		var layout : Layout = new LayoutLandscape(this.ViewMap);
		layout.Init(this.ElementTop, 0, 200);
		layout.Traverse(this.ElementTop, 0, 200);
	}

	Draw(Screen: ScreenManager): void {
		var shapelayer = $(Screen.ShapeLayer);
		var screenlayer = $(Screen.ContentLayer);
		for (var viewkey in this.ViewMap) {
			this.ViewMap[viewkey].AppendHTMLElement(shapelayer, screenlayer);
		}
	}

}


class ServerApi {
	constructor(url: string) {
	}
	GetCase(project: string, id: string): string {
		return "[]";
	}
}

class ScrollManager {
	InitialOffsetX: number = 0;
	InitialOffsetY: number = 0;
	InitialX: number = 0;
	InitialY: number = 0;
	CurrentX: number = 0;
	CurrentY: number = 0;
	MainPointerID: number = 0;
	Pointers: Pointer[] = [];

	SetInitialOffset(InitialOffsetX: number, InitialOffsetY: number) {
		this.InitialOffsetX = InitialOffsetX;
		this.InitialOffsetY = InitialOffsetY;
	}

	StartDrag(InitialX: number, InitialY: number) {
		this.InitialX = InitialX;
		this.InitialY = InitialY;
	}

	UpdateDrag(CurrentX: number, CurrentY: number) {
		this.CurrentX = CurrentX;
		this.CurrentY = CurrentY;
	}

	CalcOffsetX(): number {
		return this.CurrentX - this.InitialX + this.InitialOffsetX;
	}

	CalcOffsetY(): number {
		return this.CurrentY - this.InitialY + this.InitialOffsetY;
	}

	GetMainPointer(): Pointer {
		for (var i = 0; i < this.Pointers.length; ++i) {
			if (this.Pointers[i].identifier === this.MainPointerID) {
				return this.Pointers[i]
			}
		};
		return null;
	}

	IsDragging(): boolean {
		return this.MainPointerID != null;
	}

	OnPointerEvent(e: PointerEvent, Screen: ScreenManager) {
		this.Pointers = e.getPointerList();
		if (this.Pointers.length > 0) {
			if (this.IsDragging()) {
				var mainPointer = this.GetMainPointer();
				if (mainPointer) {
					this.UpdateDrag(mainPointer.pageX, mainPointer.pageY);
					Screen.SetOffset(this.CalcOffsetX(), this.CalcOffsetY());
				} else {
					this.MainPointerID = null;
				}
			} else {
				var mainPointer = this.Pointers[0];
				this.MainPointerID = mainPointer.identifier;
				this.SetInitialOffset(Screen.GetOffsetX(), Screen.GetOffsetY());
				this.StartDrag(mainPointer.pageX, mainPointer.pageY);
			}
		} else {
			this.MainPointerID = null;
		}
	}

	OnDoubleTap(e: PointerEvent, Screen: ScreenManager) {
		var width: number = Screen.ContentLayer.clientWidth;
		var height: number = Screen.ContentLayer.clientHeight;
		var pointer = this.Pointers[0];
		//Screen.SetOffset(width / 2 - pointer.pageX, height / 2 - pointer.pageY);
	}
}

class ScreenManager {
	
	ScrollManager: ScrollManager = new ScrollManager();
	private OffsetX: number;
	private OffsetY: number;

	constructor(public ShapeLayer: SVGGElement, public ContentLayer: HTMLDivElement, public ControlLayer: HTMLDivElement, public BackGroundLayer: HTMLDivElement) {
		this.SetOffset(0, 0);
		var OnPointer = (e: PointerEvent) => { this.ScrollManager.OnPointerEvent(e, this); };
		BackGroundLayer.addEventListener("pointerdown", OnPointer, false);
		BackGroundLayer.addEventListener("pointermove", OnPointer, false);
		BackGroundLayer.addEventListener("pointerup", OnPointer, false);
		BackGroundLayer.addEventListener("gesturedoubletap", (e: PointerEvent) => { this.ScrollManager.OnDoubleTap(e, this); }, false);
		ContentLayer.addEventListener("pointerdown", OnPointer, false);
		ContentLayer.addEventListener("pointermove", OnPointer, false);
		ContentLayer.addEventListener("pointerup", OnPointer, false);
		ContentLayer.addEventListener("gesturedoubletap", (e: PointerEvent) => { this.ScrollManager.OnDoubleTap(e, this); }, false);
		//BackGroundLayer.addEventListener("gesturescale", OnPointer, false);
	}

	//onScale(e: GestureScaleEvent): void {
	//	e.preventDefault();
	//	e.stopPropagation();
	//	//if (this.viewer.moving) return;
	//	//var b = e.scale * this.scale0 / this.viewer.scale;
	//	//this.setScale(e.centerX, e.centerY, b);
	//}

	SetOffset(x: number, y: number) {
		this.OffsetX = x;
		this.OffsetY = y;
		
		var TranslationMatrix = this.ShapeLayer.transform.baseVal.getItem(0).matrix;
		TranslationMatrix.e = x;
		TranslationMatrix.f = y;

		var xpx = x + "px";
		var ypx = y + "px";
		this.ContentLayer.style.left = xpx;
		this.ContentLayer.style.top  = ypx;
		this.ControlLayer.style.marginLeft = xpx;
		this.ControlLayer.style.marginTop  = ypx;
	}

	GetOffsetX(): number {
		return this.OffsetX;
	}

	GetOffsetY(): number {
		return this.OffsetY;
	}

}


function StartCaseViewer(url: string, id: string) {
	var loader = new ServerApi(url);
	var project; // temp
	var JsonData = loader.GetCase(project, id);
	var Argument = new Argument();
	var model = new CaseDecoder().ParseJson(Argument, JsonData);
	var CaseViewer = new CaseViewer(model);
	var svg = document.getElementById(id);
	CaseViewer.Draw(svg);
}
