import pandas as pd
import os
import json
import numpy as np
from pathlib import Path

class MMFashionDataset:
    def __init__(self, mmfashion_path='../data/mmfashion'):
        """Initialize the dataset handler for MMFashion.
        
        Args:
            mmfashion_path: Path to the mmfashion directory
        """
        # Convert relative path to absolute path
        self.mmfashion_path = Path(os.path.dirname(__file__)) / mmfashion_path
        
        # Check if mmfashion directory exists
        if not self.mmfashion_path.exists():
            print(f"MMFashion not found at {self.mmfashion_path}")
            print("Please ensure the MMFashion repository is cloned in the backend/data directory.")
            self.categories = []
            self.attributes = []
            self.dataset_ready = False
        else:
            # Initialize sample categories and attributes based on DeepFashion categories
            # These would normally be loaded from the dataset
            self.categories = [
                'shirt', 't-shirt', 'top', 'sweater', 'jacket', 'dress', 'pants', 
                'jeans', 'skirt', 'shorts', 'coat', 'blouse', 'hoodie'
            ]
            
            # Sample attributes based on common clothing attributes
            self.attributes = {
                'colors': ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'gray'],
                'patterns': ['solid', 'striped', 'plaid', 'floral', 'dotted'],
                'materials': ['cotton', 'denim', 'leather', 'silk', 'wool', 'synthetic']
            }
            
            # Create sample items data (for demonstration)
            self.create_sample_items()
            
            self.dataset_ready = True
            print(f"Initialized MMFashion handler with {len(self.items)} sample items")
    
    def create_sample_items(self, num_items=50):
        """Create sample clothing items for demonstration"""
        np.random.seed(42)  # For reproducible results
        
        self.items = []
        for i in range(num_items):
            category = np.random.choice(self.categories)
            color = np.random.choice(self.attributes['colors'])
            pattern = np.random.choice(self.attributes['patterns'])
            material = np.random.choice(self.attributes['materials'])
            
            # Create a unique ID
            item_id = f"item_{i+1:04d}"
            
            # For formal vs casual classification
            is_formal = category in ['shirt', 'dress', 'pants', 'coat', 'blouse']
            style = 'formal' if is_formal else 'casual'
            
            self.items.append({
                'id': item_id,
                'category': category,
                'color': color,
                'pattern': pattern,
                'material': material,
                'style': style
            })
    
    def get_categories(self):
        """Return all clothing categories in the dataset"""
        return self.categories
    
    def get_attributes(self):
        """Return all attributes and their possible values"""
        return self.attributes
    
    def get_items_by_category(self, category, limit=5):
        """Return items of a specific category"""
        if not self.dataset_ready:
            return []
        
        items = [item for item in self.items if item['category'] == category]
        if len(items) > limit:
            # Randomly select 'limit' items
            items = np.random.choice(items, limit, replace=False).tolist()
        return items
    
    def get_matching_items(self, style, limit=5):
        """Return items matching a style (casual or formal)"""
        if not self.dataset_ready:
            return []
        
        matches = [item for item in self.items if item['style'] == style]
        
        if len(matches) > limit:
            # Randomly select 'limit' items
            selected_indices = np.random.choice(len(matches), limit, replace=False)
            matches = [matches[i] for i in selected_indices]
        
        return matches


# For backward compatibility, create an alias
ClothingDataset = MMFashionDataset 