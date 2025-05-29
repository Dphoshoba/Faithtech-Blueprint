interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  templates: string[]; // Template IDs
  resources: string[]; // Resource IDs
  condition: (assessmentData: any) => boolean;
}

export class RecommendationEngine {
  private recommendations: Recommendation[] = [];
  
  constructor(recommendations: Recommendation[]) {
    this.recommendations = recommendations;
  }
  
  // Process assessment results and generate recommendations
  generateRecommendations(assessmentData: any) {
    // Filter recommendations that match conditions
    const matchingRecommendations = this.recommendations.filter(rec => {
      return rec.condition(assessmentData);
    });
    
    // Group by category
    const groupedRecommendations = this.groupByCategory(matchingRecommendations);
    
    // Sort by priority
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    for (const category in groupedRecommendations) {
      groupedRecommendations[category].sort((a, b) => {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    }
    
    return {
      recommendations: matchingRecommendations,
      groupedRecommendations,
      topRecommendations: this.getTopRecommendations(matchingRecommendations, 3)
    };
  }
  
  // Group recommendations by category
  private groupByCategory(recommendations: Recommendation[]) {
    return recommendations.reduce((grouped: any, rec) => {
      if (!grouped[rec.category]) {
        grouped[rec.category] = [];
      }
      grouped[rec.category].push(rec);
      return grouped;
    }, {});
  }
  
  // Get top N recommendations based on priority
  private getTopRecommendations(recommendations: Recommendation[], count: number) {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return [...recommendations]
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, count);
  }
} 