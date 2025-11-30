/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { GraphArchParser } from "@web/views/graph/graph_arch_parser";
import { GraphRenderer } from "@web/views/graph/graph_renderer";
import { GraphModel } from "@web/views/graph/graph_model";
import { graphView } from "@web/views/graph/graph_view";

// Patch GraphArchParser pour récupérer la classe CSS de l'élément graph
patch(GraphArchParser.prototype, {
    parse(arch, fields = {}) {
        const archInfo = super.parse(arch, fields);
        
        // Récupérer la classe CSS de l'élément racine <graph>
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(arch, "text/xml");
        const graphNode = xmlDoc.querySelector("graph");
        if (graphNode && graphNode.hasAttribute("class")) {
            archInfo.className = graphNode.getAttribute("class");
        }
        
        return archInfo;
    }
});

// Patch la fonction props de graphView pour inclure className dans modelParams
const originalProps = graphView.props;
graphView.props = (genericProps, view) => {
    const result = originalProps(genericProps, view);
    
    // Ajouter className aux modelParams si disponible
    if (!genericProps.state) {
        const { arch, fields } = genericProps;
        const parser = new view.ArchParser();
        const archInfo = parser.parse(arch, fields);
        if (archInfo.className) {
            result.modelParams.className = archInfo.className;
        }
    }
    
    return result;
};

// Patch GraphRenderer pour masquer la légende si la classe o_graph_no_legend est présente
patch(GraphRenderer.prototype, {
    getLegendOptions() {
        const legendOptions = super.getLegendOptions(...arguments);
        
        // Vérifier si la classe o_graph_no_legend est définie
        const className = this.model.metaData.className || "";
        if (className.includes("o_graph_no_legend")) {
            legendOptions.display = false;
        }
        
        return legendOptions;
    }
});

// Patch GraphModel pour forcer le chargement de toutes les données
patch(GraphModel.prototype, {
    async _fetchDataPoints(metaData, forceUseAllDataPoints = false) {
        // Si la classe o_graph_load_all est présente, forcer le chargement
        const className = metaData.className || "";
        if (className.includes("o_graph_load_all")) {
            forceUseAllDataPoints = true;
        }
        return super._fetchDataPoints(metaData, forceUseAllDataPoints);
    }
});
