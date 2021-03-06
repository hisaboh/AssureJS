var AssureIt;
(function (AssureIt) {
    var CaseAnnotation = (function () {
        function CaseAnnotation(Name, Body) {
            this.Name = Name;
            this.Body = Body;
        }
        return CaseAnnotation;
    })();
    AssureIt.CaseAnnotation = CaseAnnotation;

    (function (NodeType) {
        NodeType[NodeType["Goal"] = 0] = "Goal";
        NodeType[NodeType["Context"] = 1] = "Context";
        NodeType[NodeType["Strategy"] = 2] = "Strategy";
        NodeType[NodeType["Evidence"] = 3] = "Evidence";
    })(AssureIt.NodeType || (AssureIt.NodeType = {}));
    var NodeType = AssureIt.NodeType;

    var NodeModel = (function () {
        function NodeModel(Case, Parent, Type, Label, Statement) {
            this.Case = Case;
            this.Type = Type;
            this.Label = Case.NewLabel(Type, Label);
            this.Statement = (Statement == null) ? "" : Statement.replace(/[\n\r]$/g, "");
            this.Parent = Parent;
            if (Parent != null) {
                Parent.AppendChild(this);
            }
            this.Children = [];
            this.Annotations = [];
            this.Notes = {};

            Case.ElementMap[this.Label] = this;
            this.LineNumber = 1;
        }
        NodeModel.prototype.EnableEditFlag = function () {
            this.InvokePatternPlugIn();
            this.Case.SetModified(true);
        };

        NodeModel.prototype.AppendChild = function (Node) {
            this.Children.push(Node);
            Node.Parent = this;
            this.EnableEditFlag();
        };

        NodeModel.prototype.RemoveChild = function (Node) {
            for (var i = 0; i < this.Children.length; i++) {
                if (this.Children[i].Label == Node.Label) {
                    this.Children.splice(i, 1);
                }
            }
            this.EnableEditFlag();
        };

        NodeModel.prototype.UpdateChild = function (oldNode, newNode) {
            for (var i = 0; i < this.Children.length; i++) {
                if (this.Children[i].Label == oldNode.Label) {
                    this.Children[i] = newNode;
                }
            }
            this.EnableEditFlag();
        };

        NodeModel.prototype.GetAnnotation = function (Name) {
            for (var i = 0; i < this.Annotations.length; i++) {
                if (this.Annotations[i].Name == Name) {
                    return this.Annotations[i];
                }
            }
            return null;
        };

        NodeModel.prototype.SetAnnotation = function (Name, Body) {
            for (var i = 0; i < this.Annotations.length; i++) {
                if (this.Annotations[i].Name == Name) {
                    this.Annotations[i].Body = Body;
                    return;
                }
            }
            this.Annotations.push(new CaseAnnotation(Name, Body));
        };

        NodeModel.prototype.SetNote = function (Name, Body) {
            this.Notes[Name] = Body;
            this.EnableEditFlag();
        };

        NodeModel.prototype.GetNote = function (Name) {
            if (Name in this.Notes) {
                return this.Notes[Name];
            }
            return null;
        };

        NodeModel.prototype.eachChildren = function (f) {
            for (var i = 0; i < this.Children.length; i++) {
                f(i, this.Children[i]);
            }
        };

        NodeModel.prototype.traverse = function (f) {
            function traverse_(n, f) {
                n.eachChildren(function (i, v) {
                    f(i, v);
                    traverse_(v, f);
                });
            }
            f(-1, this);
            traverse_(this, f);
        };

        NodeModel.prototype.SearchNode = function (keyword, HitNodes) {
            if ((this.Statement).indexOf(keyword) != -1) {
                HitNodes.push(this);
            }

            for (var i = 0; i < this.Children.length; i++) {
                this.Children[i].SearchNode(keyword, HitNodes);
            }
            return HitNodes;
        };

        NodeModel.prototype.InvokePatternPlugInRecursive = function (model) {
            var pluginMap = this.Case.pluginManager.PatternPlugInMap;
            for (var key in pluginMap) {
                var plugin = pluginMap[key];
                plugin.Delegate(model);
            }
            for (var i in model.Children) {
                this.InvokePatternPlugInRecursive(model.Children[i]);
            }
        };
        NodeModel.prototype.InvokePatternPlugIn = function () {
            this.InvokePatternPlugInRecursive(this);
        };
        return NodeModel;
    })();
    AssureIt.NodeModel = NodeModel;

    var Case = (function () {
        function Case(CaseName, CaseId, CommitId, pluginManager) {
            this.CaseName = CaseName;
            this.CaseId = CaseId;
            this.CommitId = CommitId;
            this.pluginManager = pluginManager;
            this.isModified = false;
            this.isEditable = false;
            this.isLatest = true;
            this.IdCounters = [{}, {}, {}, {}, {}];
            this.ElementMap = {};
        }
        Case.prototype.DeleteNodesRecursive = function (root) {
            var Children = root.Children;
            delete this.ElementMap[root.Label];
            for (var i = 0; i < Children.length; i++) {
                this.DeleteNodesRecursive(Children[i]);
            }
            this.SetModified(true);
        };

        Case.prototype.ClearNodes = function () {
            this.IdCounters = [{}, {}, {}, {}, {}];
            this.ElementMap = {};
        };

        Case.prototype.SetElementTop = function (ElementTop) {
            this.ElementTop = ElementTop;
            this.SaveIdCounterMax(ElementTop);
        };

        Case.prototype.SaveIdCounterMax = function (Element) {
            for (var i = 0; i < Element.Children.length; i++) {
                this.SaveIdCounterMax(Element.Children[i]);
            }
            var m = Element.Label.match(/^[GCSE][0-9]+$/);
            if (m == null) {
                return;
            }
            if (m.length == 1) {
                var prefix = m[0][0];
                var count = Number(m[0].substring(1));
                switch (prefix) {
                    case "G":
                        this.IdCounters[NodeType["Goal"]][String(count)] = true;
                        break;
                    case "C":
                        this.IdCounters[NodeType["Context"]][String(count)] = true;
                        break;
                    case "S":
                        this.IdCounters[NodeType["Strategy"]][String(count)] = true;
                        break;
                    case "E":
                        this.IdCounters[NodeType["Evidence"]][String(count)] = true;
                        break;
                    default:
                        console.log("invalid label prefix :" + prefix);
                }
            }
        };

        Case.prototype.Label_getNumber = function (Label) {
            if (Label == null || Label.length <= 1)
                return -1;
            return Number(Label.substring(1));
        };

        Case.prototype.ClearIdCounters = function () {
            this.IdCounters = [{}, {}, {}, {}, {}];
        };

        Case.prototype.Object_Clone = function (obj) {
            var f = {};
            var keys = Object.keys(obj);
            for (var i in keys) {
                f[keys[i]] = obj[keys[i]];
            }
            return f;
        };

        Case.prototype.ElementMap_Clone = function (obj) {
            return this.Object_Clone(obj);
        };

        Case.prototype.IdCounters_Clone = function (obj) {
            var IdCounters = [];
            for (var i in obj) {
                IdCounters.push(this.Object_Clone(obj[i]));
            }
            return IdCounters;
        };

        Case.prototype.ElementMap_removeChild = function (ElementMap, model) {
            if (ElementMap[model.Label] == undefined) {
                console.log("wrong with nodemodel");
            }
            delete (ElementMap[model.Label]);
            for (var i in model.Children) {
                this.ElementMap_removeChild(ElementMap, model.Children[i]);
            }
            return ElementMap;
        };

        Case.prototype.IdCounters_removeChild = function (IdCounters, model) {
            var count = Number(model.Label.substring(1));
            if (IdCounters[model.Type][count] == undefined) {
                console.log("wrong with idcounters");
            }
            delete (IdCounters[model.Type][count]);
            for (var i in model.Children) {
                this.IdCounters_removeChild(IdCounters, model.Children[i]);
            }
            return IdCounters;
        };

        Case.prototype.ReserveElementMap = function (model) {
            var ElementMap = this.ElementMap;
            this.ElementMap = this.ElementMap_removeChild(this.ElementMap_Clone(this.ElementMap), model);
            return ElementMap;
        };

        Case.prototype.ReserveIdCounters = function (model) {
            var IdCounters = this.IdCounters;
            this.IdCounters = this.IdCounters_removeChild(this.IdCounters_Clone(this.IdCounters), model);
            return IdCounters;
        };

        Case.prototype.NewLabel = function (Type, Label) {
            var label = this.Label_getNumber(Label);
            if (label != -1) {
                if (this.IdCounters[Type][String(label)] == undefined) {
                    this.IdCounters[Type][String(label)] = true;
                    return Label;
                }
            }
            var i = 1;
            while (this.IdCounters[Type][String(i)] != undefined) {
                i++;
            }
            this.IdCounters[Type][String(i)] = true;
            return NodeType[Type].charAt(0) + i;
        };

        Case.prototype.IsLogin = function () {
            var matchResult = document.cookie.match(/userId=(\w+);?/);
            var userId = matchResult ? parseInt(matchResult[1]) : null;
            return userId != null;
        };

        Case.prototype.SetEditable = function (flag) {
            if (!this.IsLogin()) {
                this.isEditable = false;
            } else {
                this.isEditable = true;
            }
            if (flag != null) {
                this.isEditable = flag;
            }
            return;
        };

        Case.prototype.IsEditable = function () {
            return this.isEditable;
        };

        Case.prototype.IsModified = function () {
            return this.isModified;
        };

        Case.prototype.SetModified = function (s) {
            this.isModified = s;
        };

        Case.prototype.IsLatest = function () {
            return this.isLatest;
        };
        return Case;
    })();
    AssureIt.Case = Case;
})(AssureIt || (AssureIt = {}));
