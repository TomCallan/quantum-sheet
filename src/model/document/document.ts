// Not recursive! The expression tree on the other hand will be recursive.

import { QuantumElemement, QuantumElementFunctions } from "./document-element";
import { useVector2, Vec2 } from "./vectors";
import { Ref, reactive, readonly, shallowReactive, shallowRef } from "vue";
import { v4 as uuidv4 } from "uuid";

export interface QuantumDocument {
  readonly gridCellSize: Readonly<Vec2>;
  readonly elementTypes: Readonly<QuantumElementTypes>;

  /**
   * Shallow reactive blocks array
   */
  readonly blocks: ReadonlyArray<QuantumBlock<QuantumElemement>>;

  /**
   * Shallow reactive selected blocks array
   */
  readonly selectedBlocks: ReadonlySet<QuantumBlock<QuantumElemement>>;

  /**
   * Shallow ref focused block
   */
  readonly focusedBlock: Readonly<
    Ref<QuantumBlock<QuantumElemement> | undefined>
  >;

  createBlock(
    type: string,
    options: QuantumBlockCreationOptions
  ): QuantumBlock<QuantumElemement>;
  deleteBlock(block: QuantumBlock<QuantumElemement>): void;
  getBlockAt(position: Vec2): QuantumBlock<QuantumElemement> | undefined;
}

export type QuantumElementTypes = {
  [name: string]: {
    component: any;
    functions: QuantumElementFunctions;
  };
};

export interface QuantumBlock<T extends QuantumElemement> {
  readonly id: string;
  readonly type: string;
  readonly position: Readonly<Vec2>;
  readonly size: Readonly<Vec2>; // can include a fractional part
  readonly resizeable: boolean;
  readonly selected: boolean;
  readonly focused: boolean;

  setPosition(value: Vec2): void;
  setSize(value: Vec2): void;
  setSelected(value: boolean): void;
  setFocused(value: boolean): void;

  element: T;
}

type QuantumBlockCreationOptions = {
  position?: Vec2;
  resizeable?: boolean;
  serializedElement?: string;
};

function useBinarySearch() {
  /**
   * Finds the position where a new element should be inserted
   * @param array Target array
   * @param element Element to insert
   * @param compareFunction Comparision function
   */
  function getBinaryInsertIndex<T>(
    array: T[],
    element: T,
    compareFunction: (a: T, b: T) => number
  ) {
    // https://stackoverflow.com/a/29018745
    let low = 0;
    let high = array.length - 1;
    while (low <= high) {
      let middle = low + Math.floor((high - low) / 2);
      let comparison = compareFunction(array[middle], element);
      if (comparison > 0) {
        low = middle + 1;
      } else if (comparison < 0) {
        high = middle - 1;
      } else {
        return middle;
      }
    }

    return -low - 1;
  }

  return {
    getBinaryInsertIndex,
  };
}

/**
 * Create a document
 * @param elementTypes Element types in the document
 */
export function useDocument(
  elementTypes: QuantumElementTypes
): QuantumDocument {
  const gridCellSize = readonly({ x: 20, y: 20 });
  const blocks = shallowReactive<QuantumBlock<QuantumElemement>[]>([]);
  const selectedBlocks = shallowReactive<Set<QuantumBlock<QuantumElemement>>>(
    new Set()
  );
  const focusedBlock = shallowRef<QuantumBlock<QuantumElemement>>();
  const vector2 = useVector2();
  const { getBinaryInsertIndex } = useBinarySearch();

  /**
   * Creates a block with a given element type
   * @param type Element type
   * @param options Element options
   */
  function createBlock(type: string, options: QuantumBlockCreationOptions) {
    let elementType = elementTypes[type];
    if (!elementType) throw new Error(`Unknown element type ${type}`);

    // TODO: Implement serialization
    if (options.serializedElement) {
      throw new Error(`Serialization not implemented yet`);
      // element = elementType.functions.deserializeElement(options.serializedElement);
    }

    let element = elementType.functions.createElement();

    // TODO: A block added callback
    let block: QuantumBlock<QuantumElemement> = reactive({
      id: uuidv4(),
      type: type,
      position: vector2.clone(options.position ?? { x: 0, y: 0 }),
      size: { x: 10, y: 10 },
      resizeable: options.resizeable ?? true,
      selected: false as boolean,
      focused: false as boolean,
      setPosition: function (value) {}, // TODO:
      setSize: function (value) {
        this.size = value;
      },
      setSelected: function (value) {
        if (value) {
          selectedBlocks.add(this);
          this.selected = true;
        } else {
          selectedBlocks.delete(this);
          this.selected = false;
        }
      },
      setFocused: function (value) {
        if (value) {
          if (focusedBlock.value?.focused) {
            focusedBlock.value.setFocused(false);
          }

          this.focused = true;
          focusedBlock.value = this;
        } else {
          this.focused = false;
          if (focusedBlock.value == this) {
            focusedBlock.value = undefined;
          }
        }
      },
      element: element,
    });

    let insertPosition = getBinaryInsertIndex(blocks, block, (a, b) =>
      vector2.compare(a.position, b.position)
    );
    blocks.splice(
      insertPosition < 0 ? -(insertPosition + 1) : insertPosition,
      0,
      block
    );
    // TODO: Some position changed callback or so

    return block;
  }

  /**
   * Deletes a block
   * @param type
   */
  function deleteBlock(block: QuantumBlock<QuantumElemement>) {
    // TODO: A deleted callback. The element should be notified, so that it can do its thingy
    const index = blocks.indexOf(block);
    if (index >= 0) {
      blocks.splice(index, 1);
    }
  }

  function getBlockAt(position: Vec2) {
    let posX = position.x;
    let posY = position.y;
    for (let i = blocks.length - 1; i >= 0; i--) {
      let block = blocks[i];
      let blockX = block.position.x;
      let blockY = block.position.y;
      if (
        blockY <= posY &&
        posY <= blockY + block.size.y &&
        blockX <= posX &&
        posX <= blockX + block.size.x
      ) {
        return block;
      }
    }

    return undefined;
  }

  // TODO: Callbacks for
  // - Added
  // - Removed
  // - Sorted/Moved (ideally in reverse order)
  // well, not actually callbacks, the functions can stay entirely local. They're just needed to update the expression tree/scope variables

  return {
    gridCellSize,
    elementTypes: readonly(elementTypes),
    blocks,
    selectedBlocks,
    focusedBlock,
    createBlock,
    deleteBlock,
    getBlockAt,
  };
}
