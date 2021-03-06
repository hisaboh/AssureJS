/// <reference path="../../src/CaseModel.ts" />
/// <reference path="../../src/CaseViewer.ts" />
/// <reference path="../../src/PlugInManager.ts" />

class DefaultColorThemePlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.ActionPlugIn = new ColorThemeActionPlugIn(plugInManager);
		this.SVGRenderPlugIn = new DefaultColorThemeSVGRenderPlugIn(plugInManager);
	}

}

class TiffanyBlueThemePlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.ActionPlugIn = new ColorThemeActionPlugIn(plugInManager);
		this.SVGRenderPlugIn = new TiffanyBlueThemeSVGRenderPlugIn(plugInManager);
	}

}

class SimpleColorThemePlugIn extends AssureIt.PlugInSet {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.ActionPlugIn = new ColorThemeActionPlugIn(plugInManager);
		this.SVGRenderPlugIn = new SimpleColorThemeSVGRenderPlugIn(plugInManager);
	}

}

class ColorThemeSVGRenderPlugIn extends AssureIt.SVGRenderPlugIn {

	stroke: any;
	fill: any;

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.stroke = {
			"Goal":     "none",
			"Strategy": "none",
			"Context":  "none",
			"Evidence": "none"
		};
	}

	IsEnable(caseViewer: AssureIt.CaseViewer, element: JQuery): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, nodeView: AssureIt.NodeView): boolean {
		var thisNodeType: AssureIt.NodeType = nodeView.Source.Type;

		switch(thisNodeType) {
			case AssureIt.NodeType.Goal:
				nodeView.SVGShape.SetColor(this.fill.Goal, this.stroke.Goal);
				break;
			case AssureIt.NodeType.Strategy:
				nodeView.SVGShape.SetColor(this.fill.Strategy, this.stroke.Strategy);
				break;
			case AssureIt.NodeType.Context:
				nodeView.SVGShape.SetColor(this.fill.Context, this.stroke.Context);
				break;
			case AssureIt.NodeType.Evidence:
				nodeView.SVGShape.SetColor(this.fill.Evidence, this.stroke.Evidence);
				break;
			default:
				break;
		}

		return true;
	}

}

class DefaultColorThemeSVGRenderPlugIn extends ColorThemeSVGRenderPlugIn {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.fill = {
			"Goal":     "#E0E0E0",
			"Strategy": "#C0C0C0",
			"Context":  "#B0B0B0",
			"Evidence": "#D0D0D0"
		};
	}

}

class TiffanyBlueThemeSVGRenderPlugIn extends ColorThemeSVGRenderPlugIn {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.fill = {
			"Goal":     "#b4d8df",
			"Strategy": "#b4d8df",
			"Context":  "#dbf5f3",
			"Evidence": "#dbf5f3"
		};
	}

}

class SimpleColorThemeSVGRenderPlugIn extends ColorThemeSVGRenderPlugIn {

	constructor(public plugInManager: AssureIt.PlugInManager) {
		super(plugInManager);
		this.stroke = {
			"Goal":     "#000000",
			"Strategy": "#000000",
			"Context":  "#000000",
			"Evidence": "#000000",
		};
		this.fill = {
			"Goal":     "#ffffff",
			"Strategy": "#ffffff",
			"Context":  "#ffffff",
			"Evidence": "#ffffff"
		};
	}

}

class ColorThemeActionPlugIn extends AssureIt.ActionPlugIn {

	currentNodeColor: {[index: string]: string} = {};

	IsEnabled(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case): boolean {
		return true;
	}

	Delegate(caseViewer: AssureIt.CaseViewer, case0: AssureIt.Case, serverApi: AssureIt.ServerAPI): boolean {
		var self = this;

		$('.node').hover(function () {
			var thisNodeLabel: string = $(this).children('h4').text();
			self.currentNodeColor = caseViewer.ViewMap[thisNodeLabel].SVGShape.GetColor();
			caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(self.currentNodeColor["fill"], "orange");
		}, function() {
			var thisNodeLabel: string = $(this).children('h4').text();
			caseViewer.ViewMap[thisNodeLabel].SVGShape.SetColor(self.currentNodeColor["fill"], self.currentNodeColor["stroke"]);
		});

		return true;
	}

}
