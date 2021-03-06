/// <reference path="../src/CaseModel.ts" />
/// <reference path="../src/CaseDecoder.ts" />
/// <reference path="../src/CaseEncoder.ts" />
/// <reference path="../src/CaseViewer.ts" />
/// <reference path="../src/Converter.ts" />
/// <reference path="../src/ServerApi.ts" />
/// <reference path="../plugins/MenuBar/MenuBar.ts" />
/// <reference path="../plugins/Editor/Editor.ts" />
/// <reference path="../plugins/SearchNode/SearchNode.ts" />
/// <reference path="../plugins/SimplePattern/SimplePattern.ts" />
/// <reference path="../plugins/DScript/DScript.ts" />
/// <reference path="../plugins/FullScreenEditor/FullScreenEditor.ts" />
/// <reference path="../plugins/DefaultStatementRender/DefaultStatementRender.ts" />
/// <reference path="../plugins/LayoutPortrait/LayoutPortrait.ts" />
/// <reference path="../plugins/Annotation/Annotation.ts" />
/// <reference path="../plugins/Monitor/Monitor.ts" />
/// <reference path="../plugins/Note/Note.ts" />
/// <reference path="../plugins/ColorTheme/ColorTheme.ts" />
/// <reference path="../plugins/Export/Export.ts" />
/// <reference path="../plugins/SearchNode/SearchNode.ts" />
/// <reference path="../d.ts/jquery.d.ts" />

$(function () {

	var serverApi = new AssureIt.ServerAPI('',true); //TODO config for Path
	var pluginManager = new AssureIt.PlugInManager('');
	pluginManager.SetPlugIn("menu", new MenuBarPlugIn(pluginManager));
	pluginManager.SetPlugIn("editor", new EditorPlugIn(pluginManager));
	pluginManager.SetPlugIn("simplepattern", new SimplePatternPlugIn(pluginManager));
	pluginManager.SetPlugIn("dscript", new DScriptPlugIn(pluginManager));
	pluginManager.SetPlugIn("fullscreeneditor", new FullScreenEditorPlugIn(pluginManager));
	pluginManager.SetPlugIn("colortheme", new TiffanyBlueThemePlugIn(pluginManager));
	pluginManager.SetPlugIn("statements", new DefaultStatementRenderPlugIn(pluginManager));
	pluginManager.SetPlugIn("annotation", new AnnotationPlugIn(pluginManager));
	pluginManager.SetPlugIn("note", new NotePlugIn(pluginManager));
	pluginManager.SetPlugIn("monitor", new MonitorPlugIn(pluginManager));
	pluginManager.SetPlugIn("export", new ExportPlugIn(pluginManager));
	pluginManager.SetPlugIn("portraitlayout", new LayoutPortraitPlugIn(pluginManager));
	pluginManager.SetUseLayoutEngine("portraitlayout");

	/*
	var oldJsonData = serverApi.GetCase("",96);
	var converter = new AssureIt.Converter();
	var JsonData = converter.GenNewJson(oldJsonData);
	*/

	var JsonData = {
		"DCaseName": "test",
		"NodeCount": 25,
		"TopGoalLabel": "G1",
		"NodeList": "*G1\n*C1 @Def\n*S1\n**G2\n**S2\n**C3 @Def\n***G4\nHoge\n***E1\n***G5\n***C2 @Def\n***E2\n***C4 @Def\n***E3\n***G6\n***E4\n**G3\n**S3\n***G7\n***C5\n***E5\n***E6\n***G8\n***C6\n***E7\n***G9",
	}

	var Case0: AssureIt.Case = new AssureIt.Case(JsonData.DCaseName, 1, 0, pluginManager);
	Case0.SetEditable(true);
	var caseDecoder: AssureIt.CaseDecoder = new AssureIt.CaseDecoder();
	var root: AssureIt.NodeModel = caseDecoder.ParseASN(Case0, JsonData.NodeList, null);
	console.log(root);

	Case0.SetElementTop(root);

	var backgroundlayer = <HTMLDivElement>document.getElementById("background");
	var shapelayer = <SVGGElement><any>document.getElementById("layer0");
	var contentlayer = <HTMLDivElement>document.getElementById("layer1");
	var controllayer = <HTMLDivElement>document.getElementById("layer2");

	var Screen = new AssureIt.ScreenManager(shapelayer, contentlayer, controllayer, backgroundlayer);

	var Viewer = new AssureIt.CaseViewer(Case0, pluginManager, serverApi, Screen);
	Viewer.Draw();
});

